const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  
  // Create a dummy image
  const dummyFile = path.join(__dirname, 'dummy.png');
  fs.writeFileSync(dummyFile, 'dummy content');
  
  form.append('fileToUpload', fs.createReadStream(dummyFile));
  
  try {
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testUpload();
