/*
    This file is part of Ironbane MMO.

    Ironbane MMO is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ironbane MMO is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ironbane MMO.  If not, see <http://www.gnu.org/licenses/>.
*/
var Class = require('../../common/class');

module.exports = function(db) {
    var Q = require('q'),
        _ = require('underscore'),
        log = require('util').log;

    var Forum = Class.extend({
        init: function(json) {
            _.extend(this, json || {});
        }
    });

    Forum.getOnlineUsersLastDay = function() {
        var deferred = Q.defer();
        db.query('SELECT name from bcs_users WHERE last_session > '+  (Date.now()/1000 - 86400) + ' ORDER BY last_session', function(err,results) {
             if(err) {
                    deferred.reject();
                    return;
                }
                deferred.resolve(results);
        });
        return deferred.promise;
    };

    Forum.get = function() {
        var deferred = Q.defer();
        var topicQ = ' (select count(id) from forum_topics where board_id = fb.id) as topicCount, ',
            postsQ = ' (select count(id) from forum_posts where topic_id in (select id from forum_topics where board_id = fb.id)) as postCount, ';

        db.query('SELECT ' + topicQ + postsQ + 'fb.*, fc.name as category FROM forum_boards fb left join forum_cats fc on fb.forumcat=fc.id order by fc.order, fb.order',
            function(err, results) {
            if (err) {
                deferred.reject();
                return;
            }
            deferred.resolve(results);
        });
        
            return deferred.promise;
    };

    return Forum;
};