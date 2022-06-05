const axios = require('axios');
const jsdom = require('jsdom');

const { FetchWebpage, RetreiveAllPrices, RetrieveProvincePrice } = require('../src/queries/caa');

const { JSDOM } = jsdom;
const api = axios.create();

describe('CAA requests', () => {
  describe('webpage', () => {
    let response;
    beforeAll(async () => {
      response = await api(FetchWebpage());
    });

    it('should be fetched successfully', async () => {
      expect(response.status).toEqual(200);
      expect(response.data).toBeDefined();
    });

    it('should contain DOM', async () => {
      const { data } = response;
      const dom = new JSDOM(data);

      expect(dom).toBeDefined();
      expect(dom.window).toBeDefined();
      expect(dom.window.document).toBeDefined();
    });

    it('should contain price table', async () => {
      const { data } = response;
      const dom = new JSDOM(data);

      const { document } = dom.window;
      expect(document.querySelector('tbody').querySelectorAll('tr')?.length).toBeGreaterThan(0);
    });

    it('should contain provinces and their gas price in table', async () => {
      const { data } = response;
      const dom = new JSDOM(data);

      const { document } = dom.window;

      const prices = RetreiveAllPrices(document);
      expect(prices).toHaveLength(10);
      prices.forEach((price) => {
        expect(price.province).toBeDefined();
        expect(price.price).toBeGreaterThan(0);
      });
    });

    it("should contain Ontario's gas price in table", async () => {
      const { data } = response;
      const dom = new JSDOM(data);

      const { document } = dom.window;

      const price = RetrieveProvincePrice(document, 'Ontario');
      expect(price).toBeGreaterThan(0);
    });
  });
});
