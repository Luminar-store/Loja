async function test() {
  const urls = [
    'https://www.superfrete.com/api/v0/calculator',
    'https://api.superfrete.com/api/v0/calculator',
    'https://api.superfrete.com/v1/calculator',
    'https://app.superfrete.com/api/v0/calculator'
  ];
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzgxOTIyMjAsInN1YiI6IjRkRFVkc2NubG1ZU0hlOUpFQWJINWg5ajRWejEifQ.VUiMB-1iPLhaPBtsSVIfsH_VOkFcXpUTpJ1U-vlxpVI';
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from: { postal_code: "48790000" },
          to: { postal_code: "01001000" },
          services: "1,2",
          package: { weight: 1, width: 10, height: 10, length: 10 }
        })
      });
      console.log(url, res.status, await res.text());
    } catch (e) {
      console.log(url, 'Error:', e.message);
    }
  }
}
test();
