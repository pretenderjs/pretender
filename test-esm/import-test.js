import Pretender from 'pretender';

test('the esm build is importable in node', () => {
  expect(typeof Pretender).toEqual('function');
});
