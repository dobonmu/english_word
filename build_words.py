#!/usr/bin/env python3
"""words/*.txt, writing/*.txt 파일들을 읽어 js/words_data.js 로 변환합니다.

단어 데이터를 txt로 관리하면서도 file:// 로 열었을 때 fetch/CORS 문제 없이
동작하도록, 빌드 결과물을 순수 JS 변수로 임베드합니다.

사용법:
    python3 build_words.py

words/ 디렉토리 안의 각 "*.txt" 파일이 하나의 단원이 됩니다.
파일명(확장자 제외)이 단원 이름이 되고, 각 줄은 다음 형식입니다.

    단어|뜻|예문(영어)|예문(한글)|메모(선택, 문법/동의어/유의점 등)

writing/ 디렉토리 안의 각 "*.txt" 파일이 하나의 writing 세트가 됩니다.
각 줄은 다음 형식입니다.

    영어문장|한글해석|학습포인트(선택)

speaking/ 디렉토리 안의 각 "*.txt" 파일이 하나의 speaking(Q&A) 세트가 됩니다.
각 줄은 다음 형식입니다.

    질문(영어)|질문(한글)|모범답변(영어)|모범답변(한글)|대체가능표현(선택)

빈 줄이나 '#'으로 시작하는 줄은 무시합니다.
"""
import json
import os
import sys
import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORDS_DIR = os.path.join(BASE_DIR, "words")
WRITING_DIR = os.path.join(BASE_DIR, "writing")
SPEAKING_DIR = os.path.join(BASE_DIR, "speaking")
OUT_PATH = os.path.join(BASE_DIR, "js", "words_data.js")


def parse_file(path):
    unit_name = os.path.splitext(os.path.basename(path))[0]
    items = []
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.rstrip("\n").strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("|")
            if len(parts) < 2:
                print(f"[경고] {path}:{lineno} 형식 오류(무시): {line!r}", file=sys.stderr)
                continue
            word = parts[0].strip()
            meaning = parts[1].strip()
            ex_en = parts[2].strip() if len(parts) > 2 else ""
            ex_kr = parts[3].strip() if len(parts) > 3 else ""
            note = parts[4].strip() if len(parts) > 4 else ""
            items.append({
                "id": len(items) + 1,
                "word": word,
                "meaning": meaning,
                "ex_en": ex_en,
                "ex_kr": ex_kr,
                "note": note,
            })
    return unit_name, items


def parse_writing_file(path):
    set_name = os.path.splitext(os.path.basename(path))[0]
    items = []
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.rstrip("\n").strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("|")
            if len(parts) < 2:
                print(f"[경고] {path}:{lineno} 형식 오류(무시): {line!r}", file=sys.stderr)
                continue
            en = parts[0].strip()
            kr = parts[1].strip()
            point = parts[2].strip() if len(parts) > 2 else ""
            items.append({
                "id": len(items) + 1,
                "en": en,
                "kr": kr,
                "point": point,
            })
    return set_name, items


def parse_speaking_file(path):
    set_name = os.path.splitext(os.path.basename(path))[0]
    items = []
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.rstrip("\n").strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("|")
            if len(parts) < 4:
                print(f"[경고] {path}:{lineno} 형식 오류(무시): {line!r}", file=sys.stderr)
                continue
            q_en = parts[0].strip()
            q_kr = parts[1].strip()
            a_en = parts[2].strip()
            a_kr = parts[3].strip()
            point = parts[4].strip() if len(parts) > 4 else ""
            items.append({
                "id": len(items) + 1,
                "q_en": q_en,
                "q_kr": q_kr,
                "a_en": a_en,
                "a_kr": a_kr,
                "point": point,
            })
    return set_name, items


def natural_key(s):
    import re
    return [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', s)]


def main():
    if not os.path.isdir(WORDS_DIR):
        print(f"words/ 디렉토리가 없습니다: {WORDS_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted(glob.glob(os.path.join(WORDS_DIR, "*.txt")), key=lambda p: natural_key(os.path.basename(p)))
    if not files:
        print("words/*.txt 파일이 없습니다.", file=sys.stderr)
        sys.exit(1)

    vocab = {}
    total = 0
    for path in files:
        unit_name, items = parse_file(path)
        if not items:
            print(f"[경고] {path} 에 유효한 단어가 없습니다.", file=sys.stderr)
            continue
        vocab[unit_name] = items
        total += len(items)
        print(f"  {unit_name}: {len(items)}개 단어")

    writing = {}
    writing_total = 0
    if os.path.isdir(WRITING_DIR):
        wfiles = sorted(glob.glob(os.path.join(WRITING_DIR, "*.txt")), key=lambda p: natural_key(os.path.basename(p)))
        for path in wfiles:
            set_name, items = parse_writing_file(path)
            if not items:
                print(f"[경고] {path} 에 유효한 문장이 없습니다.", file=sys.stderr)
                continue
            writing[set_name] = items
            writing_total += len(items)
            print(f"  [writing] {set_name}: {len(items)}개 문장")

    speaking = {}
    speaking_total = 0
    if os.path.isdir(SPEAKING_DIR):
        sfiles = sorted(glob.glob(os.path.join(SPEAKING_DIR, "*.txt")), key=lambda p: natural_key(os.path.basename(p)))
        for path in sfiles:
            set_name, items = parse_speaking_file(path)
            if not items:
                print(f"[경고] {path} 에 유효한 문답이 없습니다.", file=sys.stderr)
                continue
            speaking[set_name] = items
            speaking_total += len(items)
            print(f"  [speaking] {set_name}: {len(items)}개 문답")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("// 이 파일은 build_words.py 로 자동 생성됩니다. words/*.txt, writing/*.txt, speaking/*.txt 를 수정한 뒤\n")
        f.write("// `python3 build_words.py` 를 다시 실행하세요.\n")
        f.write("const VOCAB_DATA = ")
        f.write(json.dumps(vocab, ensure_ascii=False, indent=2))
        f.write(";\n")
        f.write("const WRITING_DATA = ")
        f.write(json.dumps(writing, ensure_ascii=False, indent=2))
        f.write(";\n")
        f.write("const SPEAKING_DATA = ")
        f.write(json.dumps(speaking, ensure_ascii=False, indent=2))
        f.write(";\n")

    print(f"완료: {len(vocab)}개 단원, 총 {total}개 단어 / writing {len(writing)}개 세트, 총 {writing_total}개 문장 / speaking {len(speaking)}개 세트, 총 {speaking_total}개 문답 -> {OUT_PATH}")


if __name__ == "__main__":
    main()
