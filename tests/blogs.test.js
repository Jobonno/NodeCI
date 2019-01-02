const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');

});

afterEach(async () => {
    await page.close();
});

describe('When logged in', async () => {
    beforeEach(async () => {
        await page.login();
        await page.click('a[href="/blogs/new"]');
    });

    test('can see blog create form', async () => {
        const label = await page.getContentsOf('.title label');

        expect(label).toEqual('Blog Title')
    });

    describe('and using valid inputs', () => {
        beforeEach(async () => {
            await page.type('.title input', 'test-title');
            await page.type('.content input', 'test-content');
            await page.click('form button');
        });
        test('submitting takes user to review screen', async () => {
            const confirmText = await page.getContentsOf('h5');
            expect(confirmText).toEqual('Please confirm your entries')
        });
        test('submitting then saving adds blog to index page', async () => {
            await page.click('.green');
            await page.waitFor('.card');
            const cardTitle = await page.getContentsOf('.card-title');
            const cardParagraph = await page.getContentsOf('p');

            expect(cardTitle).toEqual('test-title');
            expect(cardParagraph).toEqual('test-content');
        });
    });

    describe('and using invalid inputs', async () => {
        test('the form shows an error message', async () => {
            await page.click('form button');
            const titleErrorMsg = await page.getContentsOf('.title .red-text');
            const contentErrorMsg = await page.getContentsOf('.content .red-text');

            expect(titleErrorMsg).toEqual('You must provide a value');
            expect(contentErrorMsg).toEqual('You must provide a value');
        });
    });
});

describe('When not logged in', async () => {
    let actions = [
        {
            method: 'post',
            path: 'api/blogs',
            body: {title: 'My Title', content: 'My Content'}
        },
        {
            method: 'get',
            path: 'api/blogs'
        }
    ];
    test('protected endpoints cannot be accessed', async () => {
        const results = await page.executeRequests(actions);
        for (let result of results) {
            expect(result).toEqual({error: 'You must log in!'})
        }
    });
});


