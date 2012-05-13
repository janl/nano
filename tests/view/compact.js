var specify  = require('specify')
  , helpers  = require('../helpers')
  , timeout  = helpers.timeout
  , nano     = helpers.nano
  , nock     = helpers.nock
  ;

var mock = nock(helpers.couch, "view/compact")
  , db   = nano.use("view_compact")
  ;

specify("view_compact:setup", timeout, function (assert) {
  nano.db.create("view_compact", function (err) {
    assert.equal(err, undefined, "Failed to create database");
    db.insert(
    { "views": 
      { "by_id": 
        { "map": function(doc) { emit(doc._id, doc); } } 
      }
    }, '_design/alice', function (error, response) {
      assert.equal(error, undefined, "Failed to create views");
      assert.equal(response.ok, true, "Response should be ok");
    });
  });
});

specify("view_compact:foobaz", timeout, function (assert) {
  db.insert({"foo": "baz"}, "foobaz", function (error, foo) {   
    assert.equal(error, undefined, "Should have stored foo");
    assert.equal(foo.ok, true, "Response should be ok");
    db.destroy("foobaz", foo.rev, function (error, response) {
      assert.equal(error, undefined, "Should have deleted foo");
      assert.equal(response.ok, true, "Response should be ok");
      db.view.compact("alice", function (error) {
        assert.equal(error, undefined, "Compact didn't respond");
        db.view('alice','by_id', function (error, view) {
          assert.equal(error, undefined, "View didn't respond");
          assert.equal(view.total_rows, 0, "Stuff got deleted");
        });
      });
    }); 
  });
});

specify("view_compact:teardown", timeout, function (assert) {
  nano.db.destroy("view_compact", function (err) {
    assert.equal(err, undefined, "Failed to destroy database");
    assert.ok(mock.isDone(), "Some mocks didn't run");
  });
});

specify.run(process.argv.slice(2));