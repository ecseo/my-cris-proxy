// api/cris.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { resultType = 'JSON', srchWord = '', numOfRows = '10', pageNo = '1' } = req.query || {};

  // 원본 CRIS 엔드포인트는 HTTP만 지원
  const target = new URL('http://apis.data.go.kr/1352159/crisinfodataview/list');
  // 필수/옵션 파라미터 전달
  target.searchParams.set('serviceKey', process.env.CRIS_SERVICE_KEY || '');
  target.searchParams.set('resultType', String(resultType).toUpperCase() === 'XML' ? 'XML' : 'JSON');
  if (srchWord) target.searchParams.set('srchWord', srchWord);
  if (numOfRows) target.searchParams.set('numOfRows', String(numOfRows));
  if (pageNo) target.searchParams.set('pageNo', String(pageNo));

  try {
    const upstream = await fetch(target.toString(), { method: 'GET' });
    const buf = Buffer.from(await upstream.arrayBuffer());

    // 일부 경우 content-type이 text/plain으로 오기도 하므로 보정
    const wantJson = target.searchParams.get('resultType') === 'JSON';
    res.setHeader('Content-Type', wantJson ? 'application/json; charset=utf-8'
                                           : 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(upstream.status).send(buf);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Proxy error' });
  }
}
