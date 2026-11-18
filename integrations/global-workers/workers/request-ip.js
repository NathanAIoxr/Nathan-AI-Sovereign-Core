// MIT · source: https://github.com/ardislu/cloudflare-workers/blob/0cd2df9cb604db4634b4c4a4d77a3c86efd4bcc9/ip/index.js
// License and copyright notices: ../licenses/ardislu-workers.txt
export default {
  async fetch(request) {
    return new Response(request.headers.get('CF-Connecting-IP'));
  }
}
