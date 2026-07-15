import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "appTitle": "King's Shot Alliance",
      "tabHeroes": "Heroes",
      "tabAnnouncements": "Announcements",
      "addMember": "Add Member",
      "memberName": "Member Name",
      "heroLevel": "Hero Level",
      "copyToClipboard": "Copy to Clipboard",
      "copyKo": "Copy KO",
      "copyEn": "Copy EN",
      "copied": "Copied!",
      "newAnnouncement": "New Announcement",
      "announcementTitle": "Title",
      "contentKo": "Korean Content",
      "contentEn": "English Content",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "language": "Language",
      "noMembers": "No members added yet.",
      "noAnnouncements": "No announcements added yet.",
      "viewModeEdit": "Edit View",
      "viewModeTable": "Table View",
      "sortByLevel": "Sort by Level"
    }
  },
  ko: {
    translation: {
      "appTitle": "킹샷 연맹 관리",
      "tabHeroes": "영웅 관리",
      "tabAnnouncements": "공지사항",
      "addMember": "연맹원 추가",
      "memberName": "연맹원 닉네임",
      "heroLevel": "영웅 레벨",
      "copyToClipboard": "클립보드 복사",
      "copyKo": "한국어 복사",
      "copyEn": "영어 복사",
      "copied": "복사 완료!",
      "newAnnouncement": "새 공지 작성",
      "announcementTitle": "제목",
      "contentKo": "한국어 내용",
      "contentEn": "영어 내용",
      "save": "저장",
      "cancel": "취소",
      "delete": "삭제",
      "edit": "수정",
      "language": "언어",
      "noMembers": "아직 등록된 연맹원이 없습니다.",
      "noAnnouncements": "아직 작성된 공지사항이 없습니다.",
      "viewModeEdit": "편집 모드",
      "viewModeTable": "테이블 모드",
      "sortByLevel": "레벨 정렬"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ko",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
