// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var parallel = require('run-parallel');
var series = require('run-series');

var TestCluster = require('./lib/test-cluster.js');

TestCluster.test('run thrift-get list', {
    config: {}
}, function t(cluster, assert) {
    parallel({
        list: cluster.thriftGet.bind(cluster, 'list'),
        upstream: cluster.inspectUpstream.bind(cluster)
    }, onResults);

    function onResults(err, data) {
        assert.ifError(err);

        var list = data.list;
        var upstream = data.upstream;

        assert.equal(
            upstream.meta.remotes.A.time, list.remotes.A.time
        );
        assert.equal(
            upstream.meta.remotes.B.time, list.remotes.B.time
        );
        assert.equal(
            upstream.meta.remotes.C.time, list.remotes.C.time
        );
        assert.equal(
            upstream.meta.remotes.D.time, list.remotes.D.time
        );

        var text = list.toString();

        assert.equal(text, '' +
            ' - A  ' + upstream.meta.remotes.A.time + '\n' +
            ' - B  ' + upstream.meta.remotes.B.time + '\n' +
            ' - C  ' + upstream.meta.remotes.C.time + '\n' +
            ' - D  ' + upstream.meta.remotes.D.time
        );

        assert.end();
    }
});

TestCluster.test('run thrift-get add', {
    config: {}
}, function t(cluster, assert) {
    parallel({
        upstream: cluster.inspectUpstream.bind(cluster),
        add: series.bind(null, [
            cluster.thriftGet.bind(cluster, 'add B'),
            cluster.inspectLocalApp.bind(cluster)
        ])
    }, onResults);

    function onResults(err, data) {
        assert.ifError(err);

        var upstream = data.upstream;
        assert.equal(data.add[0], undefined);
        var files = data.add[1];

        var meta = JSON.parse(files.thrift['meta.json']);
        // console.log('upstream', upstream.meta);

        assert.equal(meta.time, upstream.meta.remotes.B.time);
        assert.equal(meta.version,
            new Date(upstream.meta.remotes.B.time).getTime()
        );
        assert.deepEqual(meta.remotes.B, upstream.meta.remotes.B);

        assert.equal(
            files.thrift['B.thrift'], upstream.remotes.B
        );

        assert.end();
    }
});