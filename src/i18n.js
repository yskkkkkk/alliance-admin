import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "appTitle": "King's Shot Alliance",
      "sunsetBadge": "Closed",
      "sunsetTitle": "Service Termination Notice",
      "sunsetP1": "Thank you for using the King's Shot Alliance Management service.",
      "sunsetP2": "In accordance with changes to our alliance operations, this service has officially been discontinued.",
      "sunsetP3": "All stored member records and announcement data have been permanently deleted from the database.",
      "sunsetContact": "For any inquiries, please contact alliance leadership via in-game mail or the alliance chat room.",
      "sunsetMetaDate": "Effective Date",
      "sunsetMetaDateVal": "September 2026",
      "sunsetMetaService": "Target System",
      "sunsetMetaServiceVal": "Alliance Management Web System",
      "sunsetMetaData": "Data Status",
      "sunsetMetaDataVal": "All databases permanently purged"
    }
  },
  ko: {
    translation: {
      "appTitle": "킹샷 연맹 관리",
      "sunsetBadge": "운영 종료",
      "sunsetTitle": "서비스 운영 종료 안내",
      "sunsetP1": "그동안 킹샷 연맹 관리 서비스를 이용해 주셔서 진심으로 감사드립니다.",
      "sunsetP2": "연맹 운영 및 관리 체계 개편에 따라 본 웹 서비스의 운영이 공식 종료되었습니다.",
      "sunsetP3": "보안 및 데이터 보호를 위해 기존에 저장되어 있던 모든 연맹원 명단 및 공지사항 데이터는 안전하게 영구 파기되었습니다.",
      "sunsetContact": "관련 문의사항이 있으신 경우 연맹 단톡방 또는 게임 내 우편을 통해 문의해 주시기 바랍니다.",
      "sunsetMetaDate": "종료 일자",
      "sunsetMetaDateVal": "2026년 9월",
      "sunsetMetaService": "대상 시스템",
      "sunsetMetaServiceVal": "킹샷 연맹 관리 웹 시스템",
      "sunsetMetaData": "데이터 처리",
      "sunsetMetaDataVal": "모든 연맹원 및 공지 데이터 영구 파기 완료"
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
