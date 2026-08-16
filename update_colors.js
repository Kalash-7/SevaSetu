const fs = require('fs');
const files = [
  'src/components/HomePage.jsx',
  'src/components/LoginPage.jsx',
  'src/components/AdminDashboard.jsx',
  'src/components/VolunteerDashboard.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace all blue with teal
  content = content.replace(/blue-/g, 'teal-');
  
  // Replace button teal classes (which were blue-600) with orange
  content = content.replace(/bg-teal-600 hover:bg-teal-700/g, 'bg-orange-500 hover:bg-orange-600');
  
  // Also fix the box shadow colors for the buttons
  content = content.replace(/37,99,235/g, '249,115,22');
  
  fs.writeFileSync(file, content);
});
console.log('done');
