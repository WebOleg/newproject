// Run: mongosh "mongodb+srv://melinux:uekHhHA5ThvKYqQE@cluster0.bsmm8gf.mongodb.net/melinux_emp" --file export_blacklist_csv.js > blacklist_export.csv

const records = db.blacklist.find({}).toArray();

print("iban;first_name;last_name;email;reason;source");

records.forEach((r, idx) => {
  const iban = (r.iban || '').replace(/\s/g, '').toUpperCase();
  const email = (r.email || '').trim().toLowerCase();
  
  let firstName = '';
  let lastName = '';
  if (r.name) {
    const parts = r.name.trim().split(' ');
    if (parts.length >= 2) {
      lastName = parts[0];
      firstName = parts.slice(1).join(' ');
    } else {
      lastName = r.name;
    }
  }
  
  const reason = (r.reason || 'Support blacklist').replace(/;/g, ',');
  const source = (r.createdBy || 'v1_migration').replace(/;/g, ',');
  
  print(`${iban};${firstName};${lastName};${email};${reason};${source}`);
});
