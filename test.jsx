var rest = require('restler');
var _ = require('underscore');
var co = require('co');
var suspend = require('co-suspend');

//doesn't work, need fix for long urls due to mysql key length (origin field WIP in fetch_image.jsx)
/*rest.get('').on('complete', function(data) {
  _.each(data.posts.post, function({$: post}){
    console.log(JSON.stringify(post.file_url,false,2)); // auto convert to object
    rest.post('http://localhost:3000/images',{ data: {url: post.file_url}}).on('complete', function(data) {
      console.log(data); // auto convert to object
    });
  })
});*/

_.each([
  'http://cs7008.vk.me/v7008292/2d34f/3Hm5yXUpOfU.jpg',
  'http://cs7008.vk.me/v7008292/2d336/Y55Ei9QOsYg.jpg',
  'https://cs7008.vk.me/v7008687/4591c/2yoPpEh7M3c.jpg',
  'https://cs7008.vk.me/v7008687/4591c/2yoPpEh7M3c.jpg',
  'https://cs7008.vk.me/v7008687/4591c/2yoPpEh7M3c.jpg',
  'https://cs7008.vk.me/v7008687/4591c/2yoPpEh7M3c.jpg',
  'http://cs7008.vk.me/v7008292/2d336/Y55Ei9QOsYg.jpg',
  'http://cs7008.vk.me/v7008292/2d336/Y55Ei9QOsYg.jpg',
  'http://cs7008.vk.me/v7008292/2d336/Y55Ei9QOsYg.jpg',
  'http://cs7008.vk.me/v7008729/26887/18hND3-A1hY.jpg',
  'https://cs7008.vk.me/v7008640/396cd/PaJ8vXDj4K4.jpg',
  'https://cs7008.vk.me/v7008711/30254/P91w3_133mU.jpg',
  'https://cs7008.vk.me/v7008292/2d316/G9ydLrA1E1k.jpg',
  'https://cs7008.vk.me/v7008292/2d316/G9ydLrA1E1k.jpg',
  'https://cs7008.vk.me/v7008292/2d316/G9ydLrA1E1k.jpg',
  'https://cs7008.vk.me/v7008292/2d316/G9ydLrA1E1k.jpg',
  'http://cs7008.vk.me/v7008645/2f3b9/mH9BiWJRxJY.jpg',
  'http://cs7008.vk.me/v7008876/2f9e3/50VyMKE7ONc.jpg',
  'http://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'http://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'http://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'http://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'https://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'https://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'https://cs7008.vk.me/v7008329/3a8ea/NtS2vQkxw2Q.jpg',
  'http://cs7008.vk.me/v7008329/3a8cc/_ZkuxvePEQA.jpg',
  'http://cs7008.vk.me/v7008861/61beb/kQmU9cD2wDo.jpg',
  'http://cs7008.vk.me/v7008186/3e93b/ZgwIWm0jBdk.jpg',
  'http://cs7008.vk.me/v7008654/39e0b/HdehcRBD1zQ.jpg',
  'http://cs7008.vk.me/v7008654/39e0b/HdehcRBD1zQ.jpg',
  'http://cs7008.vk.me/v7008654/39e0b/HdehcRBD1zQ.jpg',
  'http://cs7008.vk.me/v7008654/39e0b/HdehcRBD1zQ.jpg',
  'http://cs7008.vk.me/v7008654/39e0b/HdehcRBD1zQ.jpg',
  'http://cs7008.vk.me/v7008687/45869/fypfLA0azvs.jpg',
  'http://cs7008.vk.me/v7008687/4584e/kvgZs41lmGk.jpg'
], function(post){
  rest.post('http://localhost:3000/images',{ data: {url: post}}).on('complete', function(data) {
    console.log(data); // auto convert to object
  });
})
