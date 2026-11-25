import tts


def word(id_="w-hola", examples=1):
    return {"id": id_, "kind": "word", "es": "hola", "de": "hallo", "forms": ["hola"],
            "examples": [{"es": f"Ejemplo {i}.", "de": "x"} for i in range(examples)]}


def sit(*items):
    return {"id": "01-test", "items": list(items)}


def jobs_for(key, jobs):
    return [j for j in jobs if j.key == key]


def test_word_gives_four_files_with_one_chile_voice():
    jobs = jobs_for("w-hola", tts.plan(sit(word())))
    assert len(jobs) == 4
    assert {j.speed for j in jobs} == {"normal", "slow"}
    assert len([j for j in jobs if j.voice.startswith("cl-")]) == 2  # je Tempo eine
    for speed in ("normal", "slow"):
        voices = [j.voice for j in jobs if j.speed == speed]
        assert len(voices) == 2
        assert sum(v.startswith("cl-") for v in voices) == 1


def test_word_examples_use_ex_keys():
    jobs = tts.plan(sit(word(examples=2)))
    assert len(jobs_for("w-hola-ex1", jobs)) == 4
    assert len(jobs_for("w-hola-ex2", jobs)) == 4


def test_sentence_has_fast_only_in_chile():
    jobs = jobs_for("s-1", tts.plan(sit({"id": "s-1", "kind": "sentence", "es": "Me llamo Ana.", "de": "x"})))
    assert len(jobs) == 5
    fast = [j for j in jobs if j.speed == "fast"]
    assert len(fast) == 1 and fast[0].voice.startswith("cl-")


def test_dialog_speakers_and_speeds():
    d = {"id": "d-1", "kind": "dialog", "title": "t", "lines": [
        {"speaker": "A", "es": "Hola", "de": "x"}, {"speaker": "B", "es": "Hola", "de": "x"}]}
    jobs = tts.plan(sit(d))
    a = jobs_for("d-1-1", jobs)
    b = jobs_for("d-1-2", jobs)
    assert {(j.voice, j.speed) for j in a} == {("cl-f", "normal"), ("cl-f", "fast")}
    assert {j.speed for j in b} == {"normal", "fast"}
    assert len({j.voice for j in b}) == 1 and b[0].voice in ("mx-m", "co-m")


def test_dialog_b_voice_alternates_between_dialogs():
    def dlg(i):
        return {"id": f"d-{i}", "kind": "dialog", "title": "t", "lines": [{"speaker": "B", "es": "Hola", "de": "x"}]}
    jobs = tts.plan(sit(dlg(1), dlg(2)))
    assert jobs_for("d-1-1", jobs)[0].voice != jobs_for("d-2-1", jobs)[0].voice


def test_pair_and_grammar():
    pair = {"id": "pair-1", "kind": "pair", "es": "pero", "options": ["pero", "perro"]}
    g = {"id": "g-1", "kind": "grammar", "title": "t", "explanation": "e",
         "examples": [{"es": "A", "de": "x"}], "exercises": [{"de": "x", "es": "B"}]}
    jobs = tts.plan(sit(pair, g))
    for key in ("pair-1", "pair-1-opt1", "pair-1-opt2"):
        js = jobs_for(key, jobs)
        assert len(js) == 2 and {j.speed for j in js} == {"normal"}
        assert sum(j.voice.startswith("cl-") for j in js) == 1
    assert len(jobs_for("g-1-ex1", jobs)) == 4
    assert len(jobs_for("g-1-1", jobs)) == 4


def test_paths_and_urls():
    j = tts.plan(sit(word()))[0]
    assert j.relpath == f"{j.key}-{j.voice}-{j.speed}.mp3"


def test_only_missing_skips_matching_hashes():
    jobs = tts.plan(sit(word()))
    manifest = tts.manifest_from_jobs(jobs[:2])
    existing = {j.relpath for j in jobs[:2]}
    todo = tts.only_missing(jobs, manifest, existing)
    assert todo == jobs[2:]


def test_only_missing_regenerates_when_text_changes():
    jobs = tts.plan(sit(word()))
    manifest = tts.manifest_from_jobs(jobs)
    existing = {j.relpath for j in jobs}
    changed = tts.plan(sit({**word(), "es": "buenas"}))
    todo = tts.only_missing(changed, manifest, existing)
    assert [j.key for j in todo] == ["w-hola"] * 4


def test_only_missing_regenerates_when_file_missing():
    jobs = tts.plan(sit(word()))
    manifest = tts.manifest_from_jobs(jobs)
    existing = {j.relpath for j in jobs[1:]}
    assert tts.only_missing(jobs, manifest, existing) == jobs[:1]


def test_stale_files_are_found():
    jobs = tts.plan(sit(word()))
    manifest = tts.manifest_from_jobs(jobs)
    existing = {j.relpath for j in jobs} | {"w-weg-cl-f-normal.mp3"}
    assert tts.stale_files(manifest, existing) == {"w-weg-cl-f-normal.mp3"}


def test_manifest_has_hash_and_dedupes():
    jobs = tts.plan(sit(word()))
    m = tts.manifest_from_jobs(jobs + jobs)
    assert len(m["w-hola"]) == 4
    assert all(e["hash"] for e in m["w-hola"])


def test_fallback_order_same_country_then_next():
    assert tts.fallback_voices("cl-f") == ["cl-m", "mx-f", "mx-m", "co-f", "co-m"]
    assert tts.fallback_voices("mx-m")[0] == "mx-f"


def test_hash_depends_on_text_voice_speed():
    h = tts.text_hash("a", "cl-f", "normal")
    assert h != tts.text_hash("b", "cl-f", "normal")
    assert h != tts.text_hash("a", "cl-m", "normal")
    assert h != tts.text_hash("a", "cl-f", "slow")
