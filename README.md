# 필수 영단어장

단원별 영단어 학습 웹앱입니다. 순수 HTML/CSS/JavaScript로 만들어져 있어 서버 없이
파일을 열거나, GitHub Pages 같은 정적 호스팅에 올리기만 하면 맥/윈도우/아이폰 등
어떤 기기에서도 동일하게 동작합니다.

## 시작하기

1. `index.html`을 브라우저로 엽니다 (더블클릭 또는 우클릭 → 열기).
2. 또는 로컬 서버로 실행하고 싶다면:
   ```
   python3 -m http.server 8000
   ```
   후 `http://localhost:8000` 접속.

## 단어 추가/수정하기

`words/` 폴더 안의 `.txt` 파일이 단원 하나에 대응합니다. 파일명이 단원 이름이 됩니다.
각 줄은 다음 형식입니다.

```
단어|뜻|예문(영어)|예문(한글)
```

예:
```
Abandon|버리다, 포기하다|The settlers had to abandon their homes.|정착민들은 집을 버려야 했습니다.
```

새 단원을 추가하려면 `words/2단원.txt` 처럼 새 파일을 만들고 같은 형식으로 채우면 됩니다.

### 변경 사항 반영하기

txt 파일을 수정한 뒤에는 다음 명령으로 `js/words_data.js`를 다시 생성해야 앱에 반영됩니다.

```
python3 build_words.py
```

(Python 표준 라이브러리만 사용하므로 별도 설치가 필요 없습니다. `requirements.txt`는 형식상 제공됩니다.)

## 주요 기능

- **단어 보기**: 단원별 목록/카드 뷰, 검색, 셔플(완전 랜덤), 단어만/뜻만 보기 + 정답보기
- **중요 표시**: 단어별로 별표 표시, 3회 이상 틀리면 자동으로 중요 표시
- **오답/중요 모아보기**: 자주 틀린 단어와 중요 표시 단어를 따로 모아보고, 개별/전체 오답 기록 초기화 가능
- **객관식 시험**: 단원별/여러 단원/전체 단원/오답 단어/중요 단어 범위로 시험, 문제 수 지정(기본 50), 이전/다음 이동, 부분 맞춤 지원, 문제별 정답 바로 보기
- **단어 쓰기 시험**: 뜻을 보고 영어 단어를 직접 입력해 채점(대소문자 무시, 공백 트림), 단어를 듣고 받아쓰는 모드도 지원
- **모의고사**: 오답/중요 기록에 반영되지 않는 연습용 시험
- **음성 읽기(TTS)**: 브라우저 내장 음성으로 영어 단어 + 한국어 뜻을 순서대로 읽어줌. 단원/전체/중요/오답 목록 전체를 셔플 순서로 읽어주는 모드 지원. 속도는 설정에서 조절
- **반응형 UI**: 모바일을 우선으로 설계되어 폰에서도 깔끔하게 보임, 다크모드 자동 대응
- **기록 저장**: 브라우저 localStorage에 자동 저장되며, 설정 화면에서 JSON으로 내보내기/가져오기 가능 (기기 간 백업/이전용)

## 배포하기 (URL로 공유)

GitHub Pages를 사용하는 예시:

```
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

이후 GitHub 저장소 Settings → Pages에서 `main` 브랜치를 소스로 지정하면
`https://<username>.github.io/<repo>/` 로 접속할 수 있습니다. Vercel, Netlify에
그대로 드래그 앤 드롭해도 동작합니다.

## 기기 간 동기화 설정하기 (폰 ↔ PC 자동 합치기)

기본적으로 학습 기록은 브라우저(기기)마다 localStorage에 따로 저장됩니다. 폰에서
공부한 기록을 PC에서도 그대로 보고 싶다면 **Firebase(무료)** 를 연결하세요. 한 번
설정해두면 이후엔 구글 계정 로그인만으로 모든 기기의 기록이 자동으로 합쳐집니다.
설정하지 않아도 앱은 지금처럼 로컬 저장 방식으로 완전히 정상 동작합니다.

### 1) Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 → "프로젝트 추가"로 새 프로젝트 생성(무료 Spark 요금제 그대로 사용).
2. 왼쪽 메뉴 **Authentication** → "시작하기" → 로그인 방법 탭에서 **Google** 활성화.
3. 왼쪽 메뉴 **Firestore Database** → "데이터베이스 만들기" → 원하는 리전 선택 → **테스트 모드**로 시작(아래 4단계에서 보안 규칙을 바로 교체할 것입니다).
4. Firestore의 "규칙" 탭에서 아래 규칙으로 교체 후 게시(본인 데이터만 읽고 쓸 수 있도록 제한):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. 프로젝트 설정(톱니바퀴 아이콘) → "내 앱"에서 **웹 앱 추가**(</> 아이콘) → 앱 등록만 하고 호스팅은 건너뜁니다. 화면에 나오는 `firebaseConfig` 객체 값을 복사해둡니다.

### 2) 이 프로젝트에 설정 붙여넣기

`js/firebase-config.example.js` 파일을 `js/firebase-config.js` 로 복사한 뒤, 방금 복사한
값으로 안의 내용을 채워 넣습니다.

```
cp js/firebase-config.example.js js/firebase-config.js
```

`js/firebase-config.js`는 `.gitignore`에 등록되어 있어 `git push`해도 GitHub에는
올라가지 않습니다. **GitHub Pages로 배포한 사이트에서 로그인 기능을 쓰려면** 이
파일의 내용을 배포된 브랜치에도 반영해야 하므로(정적 호스팅은 서버 비밀값 개념이
없음), 아래 중 하나를 선택하세요.
- 간단한 방법: `.gitignore`에서 이 파일을 제외하고 그대로 커밋(Firebase 웹 API 키는
  공개되어도 위 보안 규칙이 실제 데이터 접근을 막아주므로 안전합니다. Firebase 공식
  문서도 이 방식을 권장합니다).
- 더 신경 쓰고 싶다면: Firebase Hosting(역시 무료)에 별도로 올리고 API 키 노출을
  최소화.

가장 쉬운 방법을 쓰려면:
```
git add -f js/firebase-config.js
git commit -m "add firebase config"
./push.sh
```

### 3) 확인하기

배포된 사이트(또는 로컬)에서 설정(⚙) 화면을 열면 "기기 간 동기화" 섹션에 Google
로그인 버튼이 보입니다. 폰과 PC에서 같은 구글 계정으로 로그인하면 암기 완료, 중요
표시, 오답 기록, 시험 이력이 자동으로 합쳐집니다(둘 다 있는 기록은 합집합으로 병합
되므로 기존 기록이 사라지지 않습니다).

## 참고

- 동기화를 설정하지 않았다면 학습 기록은 브라우저(기기)마다 따로 저장됩니다. 이 경우
  여러 기기의 기록을 합치려면 설정 화면의 "기록 내보내기"로 받은 JSON 파일을 다른
  기기에서 "기록 가져오기"로 불러오세요.
- 음성 읽기는 Web Speech API를 사용하므로 브라우저/OS에 설치된 음성 엔진에 따라
  음질과 사용 가능한 음성 목록이 달라질 수 있습니다.
