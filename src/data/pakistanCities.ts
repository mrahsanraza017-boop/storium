/**
 * Comprehensive Master List of Pakistan Cities and Regions
 * Covers all 4 Provinces, Islamabad Capital Territory, AJK, and Gilgit-Baltistan.
 */

export interface PakistanCityInfo {
  name: string;
  province: string;
  isMajor?: boolean;
}

export const PAKISTAN_CITIES_DATA: PakistanCityInfo[] = [
  // --- Federal Capital Territory ---
  { name: 'Islamabad', province: 'Islamabad Capital Territory', isMajor: true },

  // --- Punjab (Major & Secondary Cities & Towns) ---
  { name: 'Lahore', province: 'Punjab', isMajor: true },
  { name: 'Faisalabad', province: 'Punjab', isMajor: true },
  { name: 'Rawalpindi', province: 'Punjab', isMajor: true },
  { name: 'Gujranwala', province: 'Punjab', isMajor: true },
  { name: 'Multan', province: 'Punjab', isMajor: true },
  { name: 'Sialkot', province: 'Punjab', isMajor: true },
  { name: 'Bahawalpur', province: 'Punjab', isMajor: true },
  { name: 'Sargodha', province: 'Punjab', isMajor: true },
  { name: 'Gujrat', province: 'Punjab', isMajor: true },
  { name: 'Sheikhupura', province: 'Punjab', isMajor: true },
  { name: 'Sahiwal', province: 'Punjab', isMajor: true },
  { name: 'Jhang', province: 'Punjab', isMajor: true },
  { name: 'Rahim Yar Khan', province: 'Punjab', isMajor: true },
  { name: 'Kasur', province: 'Punjab', isMajor: true },
  { name: 'Okara', province: 'Punjab', isMajor: true },
  { name: 'Wah Cantt', province: 'Punjab', isMajor: true },
  { name: 'Dera Ghazi Khan', province: 'Punjab', isMajor: true },
  { name: 'Chiniot', province: 'Punjab' },
  { name: 'Kamoke', province: 'Punjab' },
  { name: 'Hafizabad', province: 'Punjab' },
  { name: 'Mandi Bahauddin', province: 'Punjab' },
  { name: 'Attock', province: 'Punjab' },
  { name: 'Khanewal', province: 'Punjab' },
  { name: 'Jhelum', province: 'Punjab' },
  { name: 'Muzaffargarh', province: 'Punjab' },
  { name: 'Burewala', province: 'Punjab' },
  { name: 'Bahawalnagar', province: 'Punjab' },
  { name: 'Pakpattan', province: 'Punjab' },
  { name: 'Chakwal', province: 'Punjab' },
  { name: 'Toba Tek Singh', province: 'Punjab' },
  { name: 'Vehari', province: 'Punjab' },
  { name: 'Murree', province: 'Punjab' },
  { name: 'Mianwali', province: 'Punjab' },
  { name: 'Kot Addu', province: 'Punjab' },
  { name: 'Gojra', province: 'Punjab' },
  { name: 'Wazirabad', province: 'Punjab' },
  { name: 'Daska', province: 'Punjab' },
  { name: 'Chishtian', province: 'Punjab' },
  { name: 'Layyah', province: 'Punjab' },
  { name: 'Lodhran', province: 'Punjab' },
  { name: 'Bhakkar', province: 'Punjab' },
  { name: 'Khushab', province: 'Punjab' },
  { name: 'Narowal', province: 'Punjab' },
  { name: 'Taxila', province: 'Punjab' },
  { name: 'Bhalwal', province: 'Punjab' },
  { name: 'Samundri', province: 'Punjab' },
  { name: 'Shakargarh', province: 'Punjab' },
  { name: 'Pattoki', province: 'Punjab' },
  { name: 'Chunian', province: 'Punjab' },
  { name: 'Sangla Hill', province: 'Punjab' },
  { name: 'Kamalia', province: 'Punjab' },
  { name: 'Mian Channu', province: 'Punjab' },
  { name: 'Haroonabad', province: 'Punjab' },
  { name: 'Jalalpur Jattan', province: 'Punjab' },
  { name: 'Rojhan', province: 'Punjab' },
  { name: 'Taunsa', province: 'Punjab' },
  { name: 'Hasan Abdal', province: 'Punjab' },
  { name: 'Renala Khurd', province: 'Punjab' },
  { name: 'Ahmedpur East', province: 'Punjab' },
  { name: 'Shujabad', province: 'Punjab' },
  { name: 'Kabirwala', province: 'Punjab' },
  { name: 'Alipur', province: 'Punjab' },
  { name: 'Liaquatpur', province: 'Punjab' },
  { name: 'Yazman', province: 'Punjab' },
  { name: 'Fort Abbas', province: 'Punjab' },
  { name: 'Depalpur', province: 'Punjab' },
  { name: 'Haveli Lakha', province: 'Punjab' },
  { name: 'Basirpur', province: 'Punjab' },
  { name: 'Hujra Shah Muqeem', province: 'Punjab' },
  { name: 'Pindi Bhattian', province: 'Punjab' },
  { name: 'Kot Radha Kishan', province: 'Punjab' },
  { name: 'Jaranwala', province: 'Punjab' },
  { name: 'Kharian', province: 'Punjab' },
  { name: 'Lalamusa', province: 'Punjab' },
  { name: 'Pasrur', province: 'Punjab' },
  { name: 'Sambrial', province: 'Punjab' },
  { name: 'Dina', province: 'Punjab' },
  { name: 'Sohawa', province: 'Punjab' },
  { name: 'Talagang', province: 'Punjab' },
  { name: 'Pind Dadan Khan', province: 'Punjab' },
  { name: 'Fateh Jang', province: 'Punjab' },
  { name: 'Jand', province: 'Punjab' },
  { name: 'Pindi Gheb', province: 'Punjab' },
  { name: 'Kallar Syedan', province: 'Punjab' },
  { name: 'Kahuta', province: 'Punjab' },
  { name: 'Gujar Khan', province: 'Punjab' },

  // --- Sindh ---
  { name: 'Karachi', province: 'Sindh', isMajor: true },
  { name: 'Hyderabad', province: 'Sindh', isMajor: true },
  { name: 'Sukkur', province: 'Sindh', isMajor: true },
  { name: 'Larkana', province: 'Sindh', isMajor: true },
  { name: 'Nawabshah (Shaheed Benazirabad)', province: 'Sindh', isMajor: true },
  { name: 'Mirpur Khas', province: 'Sindh', isMajor: true },
  { name: 'Jacobabad', province: 'Sindh' },
  { name: 'Shikarpur', province: 'Sindh' },
  { name: 'Khairpur', province: 'Sindh' },
  { name: 'Dadu', province: 'Sindh' },
  { name: 'Tando Adam', province: 'Sindh' },
  { name: 'Tando Allahyar', province: 'Sindh' },
  { name: 'Tando Muhammad Khan', province: 'Sindh' },
  { name: 'Thatta', province: 'Sindh' },
  { name: 'Badin', province: 'Sindh' },
  { name: 'Ghotki', province: 'Sindh' },
  { name: 'Kotri', province: 'Sindh' },
  { name: 'Umerkot', province: 'Sindh' },
  { name: 'Kandhkot', province: 'Sindh' },
  { name: 'Kashmore', province: 'Sindh' },
  { name: 'Shahdadkot', province: 'Sindh' },
  { name: 'Rohri', province: 'Sindh' },
  { name: 'Moro', province: 'Sindh' },
  { name: 'Khipro', province: 'Sindh' },
  { name: 'Sehwan', province: 'Sindh' },
  { name: 'Mehrabpur', province: 'Sindh' },
  { name: 'Ranipur', province: 'Sindh' },
  { name: 'Gambat', province: 'Sindh' },
  { name: 'Daharki', province: 'Sindh' },
  { name: 'Pano Akil', province: 'Sindh' },
  { name: 'Sanghar', province: 'Sindh' },
  { name: 'Shahdadpur', province: 'Sindh' },
  { name: 'Matiari', province: 'Sindh' },
  { name: 'Hala', province: 'Sindh' },
  { name: 'Mirpur Mathelo', province: 'Sindh' },
  { name: 'Mithi', province: 'Sindh' },
  { name: 'Islamkot', province: 'Sindh' },

  // --- Khyber Pakhtunkhwa (KPK) ---
  { name: 'Peshawar', province: 'Khyber Pakhtunkhwa', isMajor: true },
  { name: 'Mardan', province: 'Khyber Pakhtunkhwa', isMajor: true },
  { name: 'Abbottabad', province: 'Khyber Pakhtunkhwa', isMajor: true },
  { name: 'Mingora', province: 'Khyber Pakhtunkhwa', isMajor: true },
  { name: 'Swat', province: 'Khyber Pakhtunkhwa', isMajor: true },
  { name: 'Kohat', province: 'Khyber Pakhtunkhwa' },
  { name: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa' },
  { name: 'Nowshera', province: 'Khyber Pakhtunkhwa' },
  { name: 'Charsadda', province: 'Khyber Pakhtunkhwa' },
  { name: 'Mansehra', province: 'Khyber Pakhtunkhwa' },
  { name: 'Swabi', province: 'Khyber Pakhtunkhwa' },
  { name: 'Haripur', province: 'Khyber Pakhtunkhwa' },
  { name: 'Bannu', province: 'Khyber Pakhtunkhwa' },
  { name: 'Timergara', province: 'Khyber Pakhtunkhwa' },
  { name: 'Batkhela', province: 'Khyber Pakhtunkhwa' },
  { name: 'Chitral', province: 'Khyber Pakhtunkhwa' },
  { name: 'Hangu', province: 'Khyber Pakhtunkhwa' },
  { name: 'Karak', province: 'Khyber Pakhtunkhwa' },
  { name: 'Tank', province: 'Khyber Pakhtunkhwa' },
  { name: 'Risalpur', province: 'Khyber Pakhtunkhwa' },
  { name: 'Jamrud', province: 'Khyber Pakhtunkhwa' },
  { name: 'Landi Kotal', province: 'Khyber Pakhtunkhwa' },
  { name: 'Dir', province: 'Khyber Pakhtunkhwa' },
  { name: 'Shabqadar', province: 'Khyber Pakhtunkhwa' },
  { name: 'Topi', province: 'Khyber Pakhtunkhwa' },
  { name: 'Tangi', province: 'Khyber Pakhtunkhwa' },
  { name: 'Pabbi', province: 'Khyber Pakhtunkhwa' },

  // --- Balochistan ---
  { name: 'Quetta', province: 'Balochistan', isMajor: true },
  { name: 'Turbat', province: 'Balochistan', isMajor: true },
  { name: 'Khuzdar', province: 'Balochistan', isMajor: true },
  { name: 'Hub', province: 'Balochistan', isMajor: true },
  { name: 'Chaman', province: 'Balochistan' },
  { name: 'Gwadar', province: 'Balochistan' },
  { name: 'Sibi', province: 'Balochistan' },
  { name: 'Dera Murad Jamali', province: 'Balochistan' },
  { name: 'Zhob', province: 'Balochistan' },
  { name: 'Loralai', province: 'Balochistan' },
  { name: 'Pishin', province: 'Balochistan' },
  { name: 'Mastung', province: 'Balochistan' },
  { name: 'Kalat', province: 'Balochistan' },
  { name: 'Nushki', province: 'Balochistan' },
  { name: 'Kharan', province: 'Balochistan' },
  { name: 'Pasni', province: 'Balochistan' },
  { name: 'Ormara', province: 'Balochistan' },
  { name: 'Bela', province: 'Balochistan' },
  { name: 'Usta Mohammad', province: 'Balochistan' },
  { name: 'Dera Allah Yar', province: 'Balochistan' },

  // --- Azad Jammu & Kashmir (AJK) ---
  { name: 'Muzaffarabad', province: 'Azad Jammu & Kashmir', isMajor: true },
  { name: 'Mirpur', province: 'Azad Jammu & Kashmir', isMajor: true },
  { name: 'Rawalakot', province: 'Azad Jammu & Kashmir' },
  { name: 'Kotli', province: 'Azad Jammu & Kashmir' },
  { name: 'Bhimber', province: 'Azad Jammu & Kashmir' },
  { name: 'Bagh', province: 'Azad Jammu & Kashmir' },
  { name: 'Pallandri', province: 'Azad Jammu & Kashmir' },
  { name: 'Hattian Bala', province: 'Azad Jammu & Kashmir' },
  { name: 'Haveli', province: 'Azad Jammu & Kashmir' },
  { name: 'Dadyal', province: 'Azad Jammu & Kashmir' },
  { name: 'Islamgarh', province: 'Azad Jammu & Kashmir' },

  // --- Gilgit-Baltistan ---
  { name: 'Gilgit', province: 'Gilgit-Baltistan', isMajor: true },
  { name: 'Skardu', province: 'Gilgit-Baltistan', isMajor: true },
  { name: 'Chilas', province: 'Gilgit-Baltistan' },
  { name: 'Hunza (Karimabad/Aliabad)', province: 'Gilgit-Baltistan' },
  { name: 'Ghangche (Khaplu)', province: 'Gilgit-Baltistan' },
  { name: 'Shigar', province: 'Gilgit-Baltistan' },
  { name: 'Ghizer (Gahkuch)', province: 'Gilgit-Baltistan' },
  { name: 'Astore', province: 'Gilgit-Baltistan' },
  { name: 'Nagar', province: 'Gilgit-Baltistan' },
];

/** Top Major Metropolitan Centers for Quick Selection */
export const MAJOR_PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Gujrat',
  'Sahiwal',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Wah Cantt',
  'Muzaffarabad',
  'Mirpur',
  'Gilgit',
  'Skardu',
  'Gwadar',
];

/** All Pakistan Cities Alphabetically */
export const ALL_PAKISTAN_CITIES = Array.from(
  new Set(PAKISTAN_CITIES_DATA.map((c) => c.name))
).sort((a, b) => a.localeCompare(b));

/** Province mapping lookup dictionary */
const CITY_PROVINCE_MAP: Record<string, string> = {};
PAKISTAN_CITIES_DATA.forEach((c) => {
  CITY_PROVINCE_MAP[c.name.toLowerCase()] = c.province;
});

/**
 * Returns the corresponding Province for any given Pakistan city name
 */
export const getProvinceForCity = (cityName: string): string => {
  if (!cityName) return 'Punjab';
  const clean = cityName.trim().toLowerCase();
  if (CITY_PROVINCE_MAP[clean]) {
    return CITY_PROVINCE_MAP[clean];
  }
  // Partial matches
  for (const [city, prov] of Object.entries(CITY_PROVINCE_MAP)) {
    if (clean.includes(city) || city.includes(clean)) {
      return prov;
    }
  }
  return 'Punjab';
};
