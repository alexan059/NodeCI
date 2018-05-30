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
    await page.click('a.btn-floating');
  });

  test('Can see blog create form', async () => {
    const titleLabel = await page.getContentsOf('form .title label');
    const contentLabel = await page.getContentsOf('form .content label');

    expect(titleLabel).toEqual('Blog Title');
    expect(contentLabel).toEqual('Content');
  });

  describe('And using valid inputs', async () => {
    const titleText = 'This is the title input';
    const contentText = 'This is the content input for the blog.';

    beforeEach(async () => {
      await page.type('form .title input', titleText);
      await page.type('form .content input', contentText);
      await page.click('form button[type="submit"]');
    });

    test('Submitting takes user to review screen', async () => {
      const title = await page.getContentsOf('form h5');

      expect(title).toEqual('Please confirm your entries');
    });

    test('Submitting then saving adds blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card .card-title');
      const content = await page.getContentsOf('.card p');

      expect(title).toEqual(titleText);
      expect(content).toEqual(contentText);
    });
  });

  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button[type="submit"]')
    });

    test('The form shows an error message', async () => {
      const titleError = await page.getContentsOf('form .title .red-text');
      const contentError = await page.getContentsOf('form .content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
});

describe('When not logged in', async () => {

  const actions = [{
    method: 'get',
    endpoint: '/api/blogs'
  }, {
    method: 'post',
    endpoint: '/api/blogs',
    data: {
      title: 'My Title',
      content: 'My Content'
    }
  }];

  test('Blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions);

    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });

  // test('Cannot create blog post', async () => {
  //   const result = await page.post('/api/blogs', {
  //     title: 'My Title',
  //     content: 'My Content'
  //   });
  //
  //   expect(result).toEqual({ error: 'You must log in!' });
  //
  // });
  //
  // test('Cannot get a list of posts', async () => {
  //   const result = await page.get('/api/blogs');
  //
  //   expect(result).toEqual({ error: 'You must log in!' });
  // });
});