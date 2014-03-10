(function (window) {

  var App = Ember.Application.create();

  ////////////////////////////////////////////////////////////
  // EmberData
  ////////////////////////////////////////////////////////////

  App.ApplicationAdapter = DS.FirebaseAdapter.extend({
    firebase: new Firebase('https://emberfire-demo.firebaseio.com')
  });

  App.ApplicationSerializer = DS.FirebaseSerializer.extend();

  App.Post = DS.Model.extend({
    title: DS.attr('string'),
    body: DS.attr('string'),
    created: DS.attr('number'),
    published: DS.attr('number'),
    publishedDate: function () {
      return moment(this.get('published')).format('MMMM Do, YYYY');
    }.property('published'),
    user: DS.belongsTo('user', { async: true }),
    comments: DS.hasMany('comment', { async: true })
  });

  App.Comment = DS.Model.extend({
    body: DS.attr('string'),
    published: DS.attr('FirebaseServerValueTimestamp'),
    publishedDate: function () {
      var m = moment(this.get('published'));
      return '%@ at %@'.fmt(m.format('MMMM Do, YYYY'), m.format('h:mm:ss a'));
    }.property('published'),
    user: DS.belongsTo('user', { async: true })
  });

  App.User = DS.Model.extend({
    firstName: DS.attr('string'),
    avatar: DS.attr('string'),
    avatarUrl: function () {
      console.log('dasfdsaf');
      return this.get('avatar');
    }.property('avatar'),
    posts: DS.hasMany('post', { async: true })
  });

  App.RawTransform = DS.Transform.extend({
    deserialize: function(serialized) {
      return serialized;
    },
    serialize: function(deserialized) {
      return deserialized;
    }
  });

  App.FirebaseServerValueTimestampTransform = DS.Transform.extend({
    deserialize: function(serialized) {
      return serialized;
    },
    serialize: function(deserialized) {
      return deserialized;
    }
  });

  ////////////////////////////////////////////////////////////
  // Routes
  ////////////////////////////////////////////////////////////

  App.Router.map(function() {
    this.resource('posts', { path: '/posts' }, function () {
      this.route('new');
    });
    this.resource('post', { path: '/post/:post_id' });
    this.resource('users', { path: '/users' });
    this.resource('user', { path: '/user/:user_id' });
  });

    /////////////////////////////////////////////
    // Index
    /////////////////////////////////////////////

    App.IndexRoute = Ember.Route.extend({
      redirect: function () {
        this.transitionTo('posts');
      }
    });

    /////////////////////////////////////////////
    // Posts
    /////////////////////////////////////////////

    App.PostsIndexRoute = Ember.Route.extend({
      model: function() {
        return this.store.findAll('post');
      }
    });

    App.PostsIndexController = Ember.ArrayController.extend({
      actions: {

      },
      sortProperties: ['id'],
      sortAscending: false
    });

    /////////////////////////////////////////////
    // Post
    /////////////////////////////////////////////

    App.PostRoute = Ember.Route.extend({
      model: function(params) {
        return this.store.find('post', params.post_id);
      }
    });

    App.PostController = Ember.ObjectController.extend({
      actions: {
        publishComment: function (post, comment) {
          var store = this.get('store');
          Ember.RSVP.hash({
            user: post.get('user')
          })
          .then(function(promises){
            var record = store.createRecord('comment', {
              body: comment,
              published: Firebase.ServerValue.TIMESTAMP,
              user: promises.user
            });
            record.save();
            post.get('comments').addObject(record);
            post.save();
          });
        }
      }
    });

    ///////////////////////////////////////////////
    // Users
    ///////////////////////////////////////////////

    App.UsersRoute = Ember.Route.extend({
      model: function() {
        return this.store.findAll('user');
      }
    });

    App.UsersController = Ember.ArrayController.extend({
      sortProperties: ['firstName'],
      sortAscending: true
    });

    /////////////////////////////////////////////
    // User
    /////////////////////////////////////////////

    App.UserRoute = Ember.Route.extend({
      model: function(params) {
        return this.store.find('user', params.user_id);
      }
    });

    App.UserController = Ember.ObjectController.extend();

  ////////////////////////////////////////////////////////////
  // Components
  ////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////
    // Post
    ///////////////////////////////////////////////

    App.FirePostComponent = Ember.Component.extend({
      classNames: ['post'],
      classNameBindings: ['isExpanded:post-expanded', 'isSingle:post-single'],
      newComment: '',
      actions: {
        publishComment: function () {
          this.sendAction('onPublishComment', this.get('post'), this.get('newComment'));
        }
      },
    });

    App.FirePostSlugComponent = Ember.Component.extend({
      classNames: ['post-slug'],
      publishedMonth: function () {
        return moment(this.get('published')).format('MMM');
      }.property('post.published'),
      publishedDay: function () {
        return moment(this.get('published')).format('D');
      }.property('post.published')
    });

  ////////////////////////////////////////////////////////////
  // Helpers
  ////////////////////////////////////////////////////////////

  Ember.Handlebars.helper('breaklines', function(value, options) {
    var escaped = Ember.Handlebars.Utils.escapeExpression(value);
        escaped = escaped.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Ember.Handlebars.SafeString(escaped);
  });

})(window);