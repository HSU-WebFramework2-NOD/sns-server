const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag, Like } = require('../models');
const Op = require("sequelize").Op;

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  res.locals.likeList = req.user ? req.user.Like : [];
  next();
});

// router.get('/profile', isLoggedIn, (req, res) => {
//   res.render('profile', { title: 'Profile - NOD' });
// });
router.get('/profile', isLoggedIn, async(req, res) => {
  try {          
  const page = Number(req.query.page || 1); // 값이 없다면 기본값으로 1 사용
  const perPage = Number(req.query.perPage || 10);
   /* const total = await Post.countDocument({});  아래 total지우고 이부분을 총 document수 받아오는걸로 변경 */
  // const total = 20;
  const total = await Post.count({});
  const totalPage = Math.ceil(total / perPage);
  const posts = await Post.findAll({
    include: {
      model: User,
      attributes: ['id', 'nickname','email'],
    },
    order: [['createdAt', 'DESC']],
   /*  sort: {'createdAt':-1}, */
    offset: perPage * (page - 1),
    limit:perPage,
    })

    res.render('profile', {
    title: 'NOD',
    twits: posts,
    totalPage: totalPage,
    });

} catch (err) {
  console.error(err);
  next(err);
}

});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: 'Join to - NOD' });
});

router.get('/', async (req, res, next) => {
  try {           /*  http://localhost:8001/?page=1&perPage=10 */
    const page = Number(req.query.page || 1); // 값이 없다면 기본값으로 1 사용
		const perPage = Number(req.query.perPage || 10);
    const total = await Post.count({});  
    const totalPage = Math.ceil(total / perPage);
		const posts = await Post.findAll({
			include: {
			  model: User,
			  attributes: ['id', 'nickname','email'],
			},
      order: [['createdAt', 'DESC']],
     /*  sort: {'createdAt':-1}, */
      offset: perPage * (page - 1),
      limit:perPage,
		  });

		  res.render('main', {
			title: 'NOD',
			twits: posts,
      totalPage: totalPage,
		  });
		  
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    /** middle feeds */
    const page = Number(req.query.page || 1);
		const perPage = Number(req.query.perPage || 10);
		const total = 20;
    const totalPage = Math.ceil(total / perPage);
		const feed = await Post.findAll({
			include: {
			  model: User,
			  attributes: ['id', 'nickname','email'],
			},
      order: [['createdAt', 'DESC']],
     /*  sort: {'createdAt':-1}, */
      offset: perPage * (page - 1),
      limit:perPage,
		  })

    /** hashtag search */
    if (query.charAt(0) != '@') {
      const hashtag = await Hashtag.findOne({ where: { title: query } });
      let posts = [];
      if (hashtag) {
        posts = await hashtag.getPosts({ include: [{ model: User }] });
      }

      return res.render('main', {
        title: `${query} | NOD`,
        twits: feed,
        totalPage: totalPage,
        hashtagResults: posts,
        hashtagQuery: query,
      });
    }

    /** user search */
    const idToFind = query.substring(1, query.length);
    console.log(idToFind);

    let userList = [];
    userList = await User.findAll({
      where: {
        nickname : {
          [Op.like]: "%" + idToFind + "%"
        }
      }
    })

    return res.render('main', {
      title: `${query} | NOD`,
      twits: feed,
      totalPage: totalPage,
      userResults: userList,
      hashtagQuery: query,
    });

  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/like', isLoggedIn, async (req, res, next) => {
  const { myId, postId } = req.body;
  console.log(`${myId} + ${postId}`);
  try {
    const like = await Like.create({
      UserId: myId,
      PostId: postId,
    });

    const page = Number(req.query.page || 1);
		const perPage = Number(req.query.perPage || 10);
    const feed = await Post.findAll({
			include: {
			  model: User,
			  attributes: ['id', 'nickname','email'],
			},
      order: [['createdAt', 'DESC']],
     /*  sort: {'createdAt':-1}, */
      offset: perPage * (page - 1),
      limit:perPage,
		  });

    return res.render('main', {
      title: `NOD`,
      twits: feed,
      // likes: likes,
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.delete('/dislike', isLoggedIn, async (req, res, next) => {
  const { myId, postId } = req.body;
  console.log(`${myId} + ${postId}`);
  try {
    const like = await Like.destroy({
      where: {
        UserId: myId,
        PostId: postId,
      }
    });

    const page = Number(req.query.page || 1);
		const perPage = Number(req.query.perPage || 10);
    const feed = await Post.findAll({
			include: {
			  model: User,
			  attributes: ['id', 'nickname','email'],
			},
      order: [['createdAt', 'DESC']],
      offset: perPage * (page - 1),
      limit:perPage,
		  });

    return res.render('main', {
      title: `NOD`,
      twits: feed,
      // likes: likes,
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;

