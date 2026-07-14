// Shared India location catalogue for every state/city selector in the app.
// It includes all 28 states and 8 union territories, with the commonly used
// cities for each. Keep additions here so forms and filters stay consistent.
export const INDIA_CITIES_BY_STATE = Object.freeze({
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat"],
  "Andhra Pradesh": ["Amaravati", "Anantapur", "Guntur", "Kakinada", "Kurnool", "Nellore", "Tirupati", "Vijayawada", "Visakhapatnam"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"],
  Assam: ["Dibrugarh", "Dispur", "Guwahati", "Jorhat", "Nagaon", "Silchar", "Tezpur"],
  Bihar: ["Arrah", "Begusarai", "Bhagalpur", "Bihar Sharif", "Darbhanga", "Gaya", "Muzaffarpur", "Patna", "Purnia"],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: ["Bhilai", "Bilaspur", "Durg", "Jagdalpur", "Korba", "Raipur", "Rajnandgaon"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  Delhi: ["Delhi", "Dwarka", "New Delhi", "Rohini", "Saket"],
  Goa: ["Margao", "Mapusa", "Panaji", "Ponda", "Vasco da Gama"],
  Gujarat: ["Ahmedabad", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Rajkot", "Surat", "Vadodara"],
  Haryana: ["Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Panipat", "Rohtak", "Sonipat"],
  "Himachal Pradesh": ["Dharamshala", "Kullu", "Manali", "Mandi", "Shimla", "Solan"],
  "Jammu & Kashmir": ["Anantnag", "Baramulla", "Jammu", "Srinagar", "Udhampur"],
  Jharkhand: ["Bokaro", "Deoghar", "Dhanbad", "Hazaribagh", "Jamshedpur", "Ranchi"],
  Karnataka: ["Belagavi", "Bengaluru", "Davangere", "Hubballi", "Kalaburagi", "Mangaluru", "Mysuru", "Shivamogga"],
  Kerala: ["Alappuzha", "Kochi", "Kollam", "Kozhikode", "Kannur", "Thrissur", "Thiruvananthapuram"],
  Ladakh: ["Kargil", "Leh"],
  Lakshadweep: ["Kavaratti", "Agatti", "Amini", "Andrott"],
  "Madhya Pradesh": ["Bhopal", "Burhanpur", "Dewas", "Gwalior", "Indore", "Jabalpur", "Ratlam", "Sagar", "Satna", "Ujjain"],
  Maharashtra: ["Amravati", "Aurangabad", "Kolhapur", "Mumbai", "Nagpur", "Nashik", "Navi Mumbai", "Pune", "Solapur", "Thane"],
  Manipur: ["Bishnupur", "Churachandpur", "Imphal", "Thoubal"],
  Meghalaya: ["Nongstoin", "Shillong", "Tura", "Williamnagar"],
  Mizoram: ["Aizawl", "Champhai", "Kolasib", "Lunglei"],
  Nagaland: ["Dimapur", "Kohima", "Mokokchung", "Tuensang"],
  Odisha: ["Balasore", "Berhampur", "Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur"],
  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  Punjab: ["Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Mohali", "Patiala"],
  Rajasthan: ["Ajmer", "Alwar", "Bikaner", "Jaipur", "Jodhpur", "Kota", "Udaipur"],
  Sikkim: ["Gangtok", "Gyalshing", "Mangan", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Erode", "Madurai", "Salem", "Thanjavur", "Tiruchirappalli", "Tirunelveli", "Vellore"],
  Telangana: ["Hyderabad", "Karimnagar", "Khammam", "Nizamabad", "Ramagundam", "Warangal"],
  Tripura: ["Agartala", "Dharmanagar", "Kailashahar", "Udaipur"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ayodhya", "Bareilly", "Ghaziabad", "Gorakhpur", "Kanpur", "Lucknow", "Meerut", "Noida", "Prayagraj", "Varanasi"],
  Uttarakhand: ["Dehradun", "Haldwani", "Haridwar", "Kashipur", "Nainital", "Rishikesh", "Roorkee"],
  "West Bengal": ["Asansol", "Durgapur", "Howrah", "Kolkata", "Malda", "Siliguri", "Kharagpur"],
});

export const INDIA_STATES = Object.freeze(Object.keys(INDIA_CITIES_BY_STATE).sort());

export const getCitiesForState = (state) => INDIA_CITIES_BY_STATE[state] ?? [];
