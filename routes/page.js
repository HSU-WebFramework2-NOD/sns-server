const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag, Like } = require('../models');
const db = require('../models/index');
const Op = require("sequelize").Op;

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});

router.get('/profile', isLoggedIn, async(req, res) => {
  try { 
  const page = Number(req.query.page || 1);
  const perPage = Number(req.query.perPage || 10);
  const total = await Post.count({});  
  const totalPage = Math.ceil(total / perPage);
  const [results, metadata] = await db.sequelize.query(`SELECT posts.id, posts.content, posts.img, posts.UserId, 
                                                                users.nickname, users.email, likes.UserId AS likeId
                                                        FROM posts
                                                        LEFT JOIN likes ON posts.id = likes.PostId
                                                        INNER JOIN users ON posts.UserId = users.id
                                                        ORDER BY posts.createdAt DESC
                                                        LIMIT ${perPage} OFFSET ${perPage * (page - 1)};`);

    res.render('profile', {
    title: 'NOD',
    twits: results,
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
  try { 
    const page = Number(req.query.page || 1); 
		const perPage = Number(req.query.perPage || 10);
    const total = await Post.count({});  
    const totalPage = Math.ceil(total / perPage);
    const [results, metadata] = await db.sequelize.query(`SELECT posts.id, posts.content, posts.img, posts.UserId, 
                                                                 users.nickname, users.email, likes.UserId AS likeId
                                                          FROM posts
                                                          LEFT JOIN likes ON posts.id = likes.PostId
                                                          INNER JOIN users ON posts.UserId = users.id
                                                          ORDER BY posts.createdAt DESC
                                                          LIMIT ${perPage} OFFSET ${perPage * (page - 1)};`);
    console.log(results);
    res.render('main', {
    title: 'NOD',
    twits: results,
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
    const [results, metadata] = await db.sequelize.query(`SELECT posts.id, posts.content, posts.img, posts.UserId, 
                                                                 users.nickname, users.email, likes.UserId AS likeId
                                                          FROM posts
                                                          LEFT JOIN likes ON posts.id = likes.PostId
                                                          INNER JOIN users ON posts.UserId = users.id
                                                          ORDER BY posts.createdAt DESC
                                                          LIMIT ${perPage} OFFSET ${perPage * (page - 1)};`);

    /** hashtag search */
    if (query.charAt(0) != '@') {
      const hashtag = await Hashtag.findOne({ where: { title: query } });
      let posts = [];
      if (hashtag) {
        posts = await hashtag.getPosts({ include: [{ model: User }] });
      }

      return res.render('main', {
        title: `${query} | NOD`,
        twits: results,
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
      twits: results,
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
    const [results, metadata] = await db.sequelize.query(`SELECT posts.id, posts.content, posts.img, posts.UserId, 
                                                                 users.nickname, users.email, likes.UserId AS likeId
                                                          FROM posts
                                                          LEFT JOIN likes ON posts.id = likes.PostId
                                                          INNER JOIN users ON posts.UserId = users.id
                                                          ORDER BY posts.createdAt DESC
                                                          LIMIT ${perPage} OFFSET ${perPage * (page - 1)};`);

    return res.render('main', {
      title: `NOD`,
      twits: results,
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
    const [results, metadata] = await db.sequelize.query(`SELECT posts.id, posts.content, posts.img, posts.UserId, 
                                                                 users.nickname, users.email, likes.UserId AS likeId
                                                          FROM posts
                                                          LEFT JOIN likes ON posts.id = likes.PostId
                                                          INNER JOIN users ON posts.UserId = users.id
                                                          ORDER BY posts.createdAt DESC
                                                          LIMIT ${perPage} OFFSET ${perPage * (page - 1)};`);

    return res.render('main', {
      title: `NOD`,
      twits: results,
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/edit', isLoggedIn, (req, res) => {
  res.render('edit', { 
    title: 'edit to | NOD' 
  });
});

router.post('/edit', isLoggedIn, async (req, res) => {
  const { beforeNick, beforeEmail, email, nickname, password } = req.body;
  try {
    if(password == '') {
      throw Error("비밀번호를 입력해주세요");
    }
    if(email == '' && nickname == '' && password == '') {
      throw Error("입력값이 없습니다.");
    }

    const userToUpdate = await User.findAll({
      where: {
        nickname: beforeNick,
        email: beforeEmail
      }
    });
    if(userToUpdate) {
      await User.update({
        email: email,
        nickname: nickname
      }, 
      {
        where: {
          nickname: beforeNick,
        }
      });

      return res.redirect('/profile');
    }
    else {
      throw Error("존재하지 않는 사용자입니다.");
    }
  }
  catch (err) {
    console.error(err);
    next(err);
  }
})

module.exports = router;

