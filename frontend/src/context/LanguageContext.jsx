import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const LANGUAGE_KEY = 'ai_smart_lms_language';
const validLanguages = new Set(['en', 'ta', 'si']);

const translations = {
  en: {},
  ta: {
    'AI Monitoring': 'AI கண்காணிப்பு',
    'AI Quiz': 'AI வினாடி வினா',
    'Admin Management': 'நிர்வாகி மேலாண்மை',
    'Announcements': 'அறிவிப்புகள்',
    'Assignments': 'பணிகள்',
    'Audit Logs': 'தணிக்கை பதிவுகள்',
    'Completed Topics': 'முடிக்கப்பட்ட தலைப்புகள்',
    'Connected Sessions': 'இணைந்த அமர்வுகள்',
    'Curriculum Management': 'பாடத்திட்ட மேலாண்மை',
    'Curriculum Overview': 'பாடத்திட்ட மேலோட்டம்',
    'Dashboard': 'டாஷ்போர்டு',
    'Department Management': 'துறை மேலாண்மை',
    'File Manager': 'கோப்பு மேலாளர்',
    'Global Search': 'உலகளாவிய தேடல்',
    'Home': 'முகப்பு',
    'Learning Materials': 'கற்றல் பொருட்கள்',
    'Login History': 'உள்நுழைவு வரலாறு',
    'Logout': 'வெளியேறு',
    'My Curriculum': 'என் பாடத்திட்டம்',
    'My Files': 'என் கோப்புகள்',
    'My Students': 'என் மாணவர்கள்',
    'Notification Center': 'அறிவிப்பு மையம்',
    'Notification Settings': 'அறிவிப்பு அமைப்புகள்',
    Notifications: 'அறிவிப்புகள்',
    Performance: 'செயல்திறன்',
    Preferences: 'விருப்பங்கள்',
    Profile: 'சுயவிவரம்',
    Reports: 'அறிக்கைகள்',
    Results: 'முடிவுகள்',
    Search: 'தேடல்',
    'Search Analytics': 'தேடல் பகுப்பாய்வு',
    Security: 'பாதுகாப்பு',
    'Security Center': 'பாதுகாப்பு மையம்',
    Settings: 'அமைப்புகள்',
    'Student Management': 'மாணவர் மேலாண்மை',
    'Student Marks': 'மாணவர் மதிப்பெண்கள்',
    'System Settings': 'கணினி அமைப்புகள்',
    'Teacher Management': 'ஆசிரியர் மேலாண்மை',
    'Teacher Notes': 'ஆசிரியர் குறிப்புகள்',
    Videos: 'வீடியோக்கள்',
    'Upload Video': 'வீடியோ பதிவேற்றம்',
    'User Overview': 'பயனர் மேலோட்டம்',
    'Weekly Plan': 'வார திட்டம்',
    'User Settings': 'பயனர் அமைப்புகள்',
    'Theme & Language': 'தீம் & மொழி',
    'Theme Preference': 'தீம் விருப்பம்',
    Language: 'மொழி',
    'Light Mode': 'ஒளி முறை',
    'Dark Mode': 'இருள் முறை',
    'System Default': 'கணினி இயல்பு',
    English: 'ஆங்கிலம்',
    Tamil: 'தமிழ்',
    Sinhala: 'சிங்களம்',
    'Notification Preferences': 'அறிவிப்பு விருப்பங்கள்',
    'Quiz Notifications': 'வினாடி வினா அறிவிப்புகள்',
    'Learning Material Notifications': 'கற்றல் பொருள் அறிவிப்புகள்',
    'Reminder Notifications': 'நினைவூட்டல் அறிவிப்புகள்',
    'Security Notifications': 'பாதுகாப்பு அறிவிப்புகள்',
    'Privacy Settings': 'தனியுரிமை அமைப்புகள்',
    'Profile Visibility': 'சுயவிவர காட்சி',
    Private: 'தனிப்பட்டது',
    'Role Members': 'பங்கு உறுப்பினர்கள்',
    'Public Profile': 'பொது சுயவிவரம்',
    'Phone Visibility': 'தொலைபேசி காட்சி',
    'Email Visibility': 'மின்னஞ்சல் காட்சி',
    'Save Settings': 'அமைப்புகளை சேமி',
    Saving: 'சேமிக்கிறது',
    'Login Date': 'உள்நுழைவு தேதி',
    'Logout Date': 'வெளியேறிய தேதி',
    'IP Address': 'IP முகவரி',
    Browser: 'உலாவி',
    Status: 'நிலை',
    Reason: 'காரணம்',
    'All Status': 'அனைத்து நிலை',
    Successful: 'வெற்றி',
    Failed: 'தோல்வி',
    Filter: 'வடிகட்டு',
    Filtering: 'வடிகட்டுகிறது',
    Active: 'செயலில்',
    Unknown: 'தெரியவில்லை',
  },
  si: {
    'AI Monitoring': 'AI නිරීක්ෂණය',
    'AI Quiz': 'AI ප්‍රශ්නාවලිය',
    'Admin Management': 'පරිපාලක කළමනාකරණය',
    Announcements: 'නිවේදන',
    Assignments: 'පැවරුම්',
    'Audit Logs': 'විගණන සටහන්',
    'Completed Topics': 'සම්පූර්ණ කළ මාතෘකා',
    'Connected Sessions': 'සම්බන්ධ සැසි',
    'Curriculum Management': 'විෂයමාලා කළමනාකරණය',
    'Curriculum Overview': 'විෂයමාලා සාරාංශය',
    Dashboard: 'ඩෑෂ්බෝඩ්',
    'Department Management': 'දෙපාර්තමේන්තු කළමනාකරණය',
    'File Manager': 'ගොනු කළමනාකරු',
    'Global Search': 'ගෝලීය සෙවීම',
    Home: 'මුල් පිටුව',
    'Learning Materials': 'ඉගෙනුම් ද්‍රව්‍ය',
    'Login History': 'පිවිසුම් ඉතිහාසය',
    Logout: 'පිටවීම',
    'My Curriculum': 'මගේ විෂයමාලාව',
    'My Files': 'මගේ ගොනු',
    'My Students': 'මගේ සිසුන්',
    'Notification Center': 'දැනුම්දීම් මධ්‍යස්ථානය',
    'Notification Settings': 'දැනුම්දීම් සැකසුම්',
    Notifications: 'දැනුම්දීම්',
    Performance: 'කාර්ය සාධනය',
    Preferences: 'අභිරුචි',
    Profile: 'පැතිකඩ',
    Reports: 'වාර්තා',
    Results: 'ප්‍රතිඵල',
    Search: 'සෙවීම',
    'Search Analytics': 'සෙවුම් විශ්ලේෂණ',
    Security: 'ආරක්ෂාව',
    'Security Center': 'ආරක්ෂක මධ්‍යස්ථානය',
    Settings: 'සැකසුම්',
    'Student Management': 'ශිෂ්‍ය කළමනාකරණය',
    'Student Marks': 'ශිෂ්‍ය ලකුණු',
    'System Settings': 'පද්ධති සැකසුම්',
    'Teacher Management': 'ගුරු කළමනාකරණය',
    'Teacher Notes': 'ගුරු සටහන්',
    Videos: 'වීඩියෝ',
    'Upload Video': 'වීඩියෝ උඩුගත කිරීම',
    'User Overview': 'පරිශීලක සාරාංශය',
    'Weekly Plan': 'සති සැලැස්ම',
    'User Settings': 'පරිශීලක සැකසුම්',
    'Theme & Language': 'තේමාව සහ භාෂාව',
    'Theme Preference': 'තේමා අභිරුචිය',
    Language: 'භාෂාව',
    'Light Mode': 'ආලෝක මාදිලිය',
    'Dark Mode': 'අඳුරු මාදිලිය',
    'System Default': 'පද්ධති පෙරනිමිය',
    English: 'ඉංග්‍රීසි',
    Tamil: 'දෙමළ',
    Sinhala: 'සිංහල',
    'Notification Preferences': 'දැනුම්දීම් අභිරුචි',
    'Quiz Notifications': 'ප්‍රශ්නාවලි දැනුම්දීම්',
    'Learning Material Notifications': 'ඉගෙනුම් ද්‍රව්‍ය දැනුම්දීම්',
    'Reminder Notifications': 'මතක් කිරීමේ දැනුම්දීම්',
    'Security Notifications': 'ආරක්ෂක දැනුම්දීම්',
    'Privacy Settings': 'පුද්ගලිකත්ව සැකසුම්',
    'Profile Visibility': 'පැතිකඩ දෘශ්‍යතාව',
    Private: 'පුද්ගලික',
    'Role Members': 'භූමිකා සාමාජිකයින්',
    'Public Profile': 'පොදු පැතිකඩ',
    'Phone Visibility': 'දුරකථන දෘශ්‍යතාව',
    'Email Visibility': 'ඊමේල් දෘශ්‍යතාව',
    'Save Settings': 'සැකසුම් සුරකින්න',
    Saving: 'සුරකිමින්',
    'Login Date': 'පිවිසුම් දිනය',
    'Logout Date': 'පිටවූ දිනය',
    'IP Address': 'IP ලිපිනය',
    Browser: 'බ්‍රවුසරය',
    Status: 'තත්ත්වය',
    Reason: 'හේතුව',
    'All Status': 'සියලු තත්ත්ව',
    Successful: 'සාර්ථකයි',
    Failed: 'අසාර්ථකයි',
    Filter: 'පෙරහන',
    Filtering: 'පෙරහන් කරමින්',
    Active: 'සක්‍රීය',
    Unknown: 'නොදනී',
  },
};

export const LanguageContext = createContext(null);

function getStoredLanguagePreference() {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return validLanguages.has(stored) ? stored : 'en';
}

function applyLanguage(languagePreference) {
  document.documentElement.lang = languagePreference;
  document.documentElement.dataset.language = languagePreference;
}

export function LanguageProvider({ children }) {
  const [languagePreference, setLanguagePreferenceState] = useState(getStoredLanguagePreference);

  useEffect(() => {
    applyLanguage(languagePreference);
    localStorage.setItem(LANGUAGE_KEY, languagePreference);
  }, [languagePreference]);

  const setLanguagePreference = useCallback((preference) => {
    setLanguagePreferenceState(validLanguages.has(preference) ? preference : 'en');
  }, []);

  const translate = useCallback(
    (key) => translations[languagePreference]?.[key] || translations.en[key] || key,
    [languagePreference],
  );

  const value = useMemo(
    () => ({
      languagePreference,
      setLanguagePreference,
      t: translate,
    }),
    [languagePreference, setLanguagePreference, translate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
