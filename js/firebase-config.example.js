// 기기 간 동기화(로그인 시 폰/PC 학습 기록 자동 합치기)를 켜려면:
// 1. 이 파일을 js/firebase-config.js 로 복사합니다.
// 2. Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 만들고
//    "웹 앱 추가"를 하면 아래와 비슷한 설정 객체를 보여줍니다. 그 값을 그대로 붙여넣으세요.
// 3. Authentication에서 "Google" 로그인 방법을 사용 설정하세요.
// 4. Firestore Database를 만드세요(테스트 모드로 시작해도 됩니다. 보안 규칙은 README 참고).
// 5. js/firebase-config.js 는 .gitignore 에 등록되어 있어 GitHub에 올라가지 않습니다.
//    (API Key는 공개돼도 큰 문제는 없지만, 보안 규칙으로 반드시 접근을 제한하세요. README 참고)
window.FIREBASE_CONFIG = {
  apiKey: "여기에-API-KEY",
  authDomain: "여기에-프로젝트.firebaseapp.com",
  projectId: "여기에-프로젝트-ID",
  storageBucket: "여기에-프로젝트.appspot.com",
  messagingSenderId: "여기에-발신자-ID",
  appId: "여기에-APP-ID"
};
