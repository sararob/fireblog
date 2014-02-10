App = Ember.Application.create();

var ref = new Firebase("https://emberfire-blog.firebaseio.com/");
var postsRef = "https://emberfire-blog.firebaseio.com/posts/";
var usersRef = ref.child("users");
var commentsRef = ref.child("comments");


App.ApplicationRoute = Ember.Route.extend({
	activate: function() {
		var auth = new FirebaseSimpleLogin(ref, function(error, user) {
			if (error) {
				console.log(error);
			} else if (user) {
				this.controllerFor('application').set('currentUser', user);
				this.controllerFor('application').set('loggedIn', true);
				console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
				usersRef.child(user.displayName).child('imageUrl').set('graph.facebook.com/' + user.username + '/picture');
			} else {
				auth.login('facebook');
			}
		}.bind(this));

		// this.controllerFor('application').set('auth', auth);
	}
});

App.ApplicationController = Ember.ObjectController.extend({
	needs: ['application'],
	currentUser: null,
	loggedIn: false,
	actions: {
		login: function() {
			this.get('auth').login('facebook');
		}
	}
});

App.Router.map(function() {
  this.resource('posts', { path: '/posts' }, function() {
    this.route('new');
  });
  this.resource('post', { path: '/post/:post_id' }, function() {
  	this.resource('comments', function() {
  		this.route('new');
  	})
  });
});

//Post Stuff

App.PostsRoute = Ember.Route.extend({
	model: function() {
		return EmberFire.Array.create({
			ref: new Firebase("https://emberfire-blog.firebaseio.com/posts/")
		});
	}
});



App.PostsNewRoute = Ember.Route.extend({
	model: function() {
		return EmberFire.Array.create({
			ref: new Firebase("https://emberfire-blog.firebaseio.com/posts/")
		});
	},
	renderTemplate: function() {
		this.render('posts/new');
	}
});

App.PostsIndexController = Ember.ArrayController.extend({
	needs: ['application']
});

App.PostsNewController = Ember.ArrayController.extend({
	needs: ['application'],
	currentUser: Ember.computed.alias('controllers.application.currentUser'),
	actions: {
		addPost: function() {
			var today = new Date();
			var newPostRef = new Firebase(postsRef).push();

			var newPost = EmberFire.Object.create({ ref: newPostRef });

			newPost.setProperties({
				post_id: newPostRef.name(),
				post_title: this.get("post_title"),
				post_subtitle: this.get("post_subtitle"),
				post_content: this.get("post_content"),
				post_date: today.toDateString(),
				post_author: this.get('currentUser.displayName'),
				post_author_pic: 'http://graph.facebook.com/' + this.get('currentUser.username') + '/picture'
			});

			var userPostRef = usersRef.child(this.get('currentUser.displayName')).child('posts').push();
			var newUserPost = EmberFire.Object.create({ ref: userPostRef });
			newUserPost.setProperties({
				post_id: newPostRef.name(),
				post_title: this.get("post_title"),
				post_content: this.get("post_content"),
				post_subtitle: this.get("post_subtitle"),
				post_date: today.toDateString()
			});

			this.set("post_title", null);
			this.set("post_content", null);
			this.set("post_subtitle", null);
		}
	}
});

App.PostRoute = Ember.Route.extend({
  model: function(params) {
  	return EmberFire.Object.create({
  		ref: new Firebase(postsRef + params.post_id)
  	})
  },
  setupController: function(controller, model) {
  	controller.set('model', model);
  }
});

App.PostController = Ember.ObjectController.extend({
	comments: function() {
		var comment_data = this.get('model.content.comments');
		var arr = [];
		function parse_comments(comment_data) {
			for (var comment in comment_data) {
				arr.push({comment_content: comment_data[comment]['comment_content'], author_name: comment_data[comment]['author_name'], author_pic: comment_data[comment]['author_pic'], comment_date: comment_data[comment]['comment_date']});
			}
		}
		parse_comments(comment_data);
		return arr;
	}.property('model.content.comments') 
});

//Comments 

App.CommentsNewRoute = Ember.Route.extend({
	model: function(params) {
		post = this.modelFor("post");
	}
});


App.CommentsIndexRoute = Ember.Route.extend({
	model: function(params) {
		return EmberFire.Array.create({
			ref: new Firebase("https://emberfire-blog.firebaseio.com/comments")
		});
	}
});

App.CommentsNewController = Ember.ArrayController.extend({
	needs: ['application'],
	currentUser: Ember.computed.alias('controllers.application.currentUser'),
	actions: {
		addComment: function() {
			var newCommentRef = commentsRef.push();
			var newComment = EmberFire.Object.create({ ref: newCommentRef });
			// console.log(this.get("currentUser"));
			newComment.setProperties({
				comment_id: newCommentRef.name(),
				comment_content: this.get("comment_content"),
				post_id: post.content.post_id,
				author_name: this.get("currentUser.displayName"),
				author_pic: 'http://graph.facebook.com/' + this.get('currentUser.username') + '/picture',
				user: this.get('currentUser'),
				comment_date: (new Date()).toDateString()
			});

			ref.child("posts").child(post.content.post_id).child("comments").push({
				comment_id: newCommentRef.name(),
				comment_content: this.get("comment_content"),
				post_id: post.content.post_id,
				author_name: this.get("currentUser.displayName"),
				author_pic: 'http://graph.facebook.com/' + this.get('currentUser.username') + '/picture',
				comment_date: (new Date()).toDateString()
			});

			this.set("comment_content", null);
		}
	}
});



