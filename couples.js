// Attendee data — from the NFC 삼겹줄 signup responses (Form responses 1).
// Names and how-they-met texts are verbatim from the sheet.
// Edit this list freely; ids must stay unique.
window.COUPLES = [
  { id: 1,  husband: "남윤수",        wife: "이하나",        duration: "1-4년",   howMet: "스키장에서" },
  { id: 2,  husband: "유경식",        wife: "이수진",        duration: "1-4년",   howMet: "교회친구 소개로 만났습니다" },
  { id: 3,  husband: "강민성",        wife: "허인아",        duration: "1년 미만", howMet: "데이팅앱을 통해서 만났습니다~" },
  { id: 4,  husband: "이윤성",        wife: "임지원",        duration: "5-10년",  howMet: "교회 청년부" },
  { id: 5,  husband: "장시온",        wife: "김예원",        duration: "1-4년",   howMet: "대학 룸메이트가 3년만에 연락와서 크리스쳔 컨퍼런스에서 좋은 친구 만났다고 친구로 소개시켜줌 (그 룸메이트는 비기독교인임)" },
  { id: 6,  husband: "조세한",        wife: "최은선",        duration: "5-10년",  howMet: "친구 소개" },
  { id: 7,  husband: "김준용",        wife: "김다홍",        duration: "1-4년",   howMet: "어플리케이션" },
  { id: 8,  husband: "권준형",        wife: "이혜민",        duration: "1-4년",   howMet: "멕시코 vs 한국 월드컵을 보다가!" },
  { id: 9,  husband: "임지섭",        wife: "박하윤",        duration: "1-4년",   howMet: "저희가 다닌 대학교 신입생 환영회에서 만났습니다😊" },
  { id: 10, husband: "윤희성",        wife: "정해인",        duration: "5-10년",  howMet: "교회 수련회" },
  { id: 11, husband: "이예람",        wife: "김민경",        duration: "5-10년",  howMet: "씨씨" },
  { id: 12, husband: "이정훈",        wife: "임은주",        duration: "1-4년",   howMet: "대학교 CC" },
  { id: 13, husband: "남상준",        wife: "김민아",        duration: "1-4년",   howMet: "Hinge + coffee date" },
  { id: 14, husband: "최준용",        wife: "전수경",        duration: "1-4년",   howMet: "아내의 남동생의 주선으로 소개팅" },
  { id: 15, husband: "조용재",        wife: "송지원",        duration: "1-4년",   howMet: "고등학교에서 만났어요" },
  { id: 16, husband: "김세진 Sae Jin Kim", wife: "노유리 Yuri Ro", duration: "1년 미만", howMet: "Coffee meets bagel app" }
];

window.coupleName = function (c) { return c.husband + " & " + c.wife; };
window.findCouple = function (id) { return window.COUPLES.find(function (c) { return c.id === id; }); };
