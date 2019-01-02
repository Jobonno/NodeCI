const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        const customPage = new CustomPage(page);

        return new Proxy(customPage, {
            get: function (target, property) {
                return target[property] || browser[property] || page[property]
            }
        });
    }

    constructor(page) {
        this.page = page;
    }

    async login() {
        const user = await userFactory();
        const {session, sig} = sessionFactory(user);
        await this.page.setCookie({name: 'session', value: session});
        await this.page.setCookie({name: 'session.sig', value: sig});
        await this.page.goto('http://localhost:3000/blogs', {waitUntil: 'domcontentloaded'});
    }

    async getContentsOf(selector) {
        return await this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
        const request = (_path) => {
            return fetch(_path, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(result => result.json());
        };
        return this.page.evaluate(request, path);
    }

    post(path, body) {
        const request = (_path, _body) => {
            return fetch(_path, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_body)
                }
            ).then(result => result.json());
        };
        return this.page.evaluate(request, path, body);
    }

    executeRequests(actions) {
        return Promise.all(
            actions.map(({method, path, data}) => {
                return this[method](path, data);
            })
        );
    }
}

module.exports = CustomPage;