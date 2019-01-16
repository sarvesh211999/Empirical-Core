const crypto = require('crypto')
const secret = process.env.SESSION_SECRET;
var salt = 'encrypted cookie';
const derivedKey = crypto.pbkdf2Sync(secret, salt, 1000, 64, 'sha1');

export interface DecodedCookie {
  session_id?: string
  _csrf_token?: string
  user_id?: number
  name?: string
  role?: string
}

export function parseCookiesString(cookies: string): any {
  const cookiesArray:string[] = cookies.split("; ")
  const cookieHash = {};
  cookiesArray.forEach((cookie) => {
    const kvPair = cookie.split("=")
    cookieHash[kvPair[0]] = kvPair[1]
  })
  return cookieHash
}

function decodeLmsSession(req): DecodedCookie {
  if (req == undefined) { return {} }
  const cookie = req.cookies[process.env.SESSION_NAME];

  if (cookie) {
    var cookieSegments = cookie.split('--');
    // if (cookieSegments.length != 2) {
    //   return next(new Error('invalid cookie format.'));
    // }
  
    var sessionData = new Buffer(cookieSegments[0], 'base64');
    // var signature = cookieSegments[1];
  
    var sessionDataSegments = sessionData.toString('utf8').split('--');
    // if (sessionDataSegments.length != 2) {
    //   return next(new Error('invalid cookie format.'));
    // }
  
    var data = new Buffer(sessionDataSegments[0], 'base64');
    var iv = new Buffer(sessionDataSegments[1], 'base64');
  
    var decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey.slice(0, 32), iv.slice(0, 16));
    var decryptedData = decipher.update(data, 'binary', 'utf8') + decipher.final('utf8');
    return JSON.parse(decryptedData)
  } else {
    return {}
  }

  
}

export default decodeLmsSession