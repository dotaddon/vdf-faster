var vdf = require('../src'),
assert = require('assert');

// TEST DATA
var simple_object = {a : 1},
    complex_object = {
        name: "Some Name",
        age: 30,
        location: [1.34, 5.53],
        obj: simple_object,
        married: false,
        working: true,
        interests: [
            {
                title: "Some 1",
                num: 1
            },
            {
                title: "Some 2",
                num: 1
            }
        ]
    },
    complex_object_encoded_f_f = '"kv" {\n\t"name" "Some Name"\n\t"age" 30\n\t"location" [\n1.34\n 5.53\n\n\t]\n\t"obj" {\n\t\t"a" 1\n\n\t}\n\t"married" false\n\t"working" true\n\t"interests" [\n{\n\t\t\t"title" "Some 1"\n\t\t\t"num" 1\n\n\t\t}\n {\n\t\t\t"title" "Some 2"\n\t\t\t"num" 1\n\n\t\t}\n\n\t]\n\n}\n\n',
    complex_object_encoded_t_f = '\tkv { \tname "Some Name" \tage 30 \tlocation [ 1.34  5.53  \t] \tobj { \ta 1  \t} \tmarried false \tworking true \tinterests [ { \ttitle "Some 1" \tnum 1  \t}  { \ttitle "Some 2" \tnum 1  \t}  \t]  \t}  \t',
    complex_object_encoded_f_t = '"kv" {\n\t"name" "Some Name"\n\n\t"age" 30\n\n\t"location" [\n1.34\n 5.53\n\n]\n\n\t"obj" {\n\t"a" 1\n\n}\n\n\t"married" false\n\n\t"working" true\n\n\t"interests" [\n{\n\t\t"title" "Some 1"\n\t\t"num" 1\n\n\t}\n {\n\t\t"title" "Some 2"\n\t\t"num" 1\n\n\t}\n\n]\n\n}\n',
    complex_object_encoded_t_t = '"kv" {\n\t"name" "Some Name" \n\t"age" 30 \n\t"location" [ 1.34  5.53  ] \n\t"obj" { \t"a" 1  } \n\t"married" false \n\t"working" true \n\t"interests" [ { \t\t"title" "Some 1" \t\t"num" 1  \t}  { \t\t"title" "Some 2" \t\t"num" 1  \t}  ] \n}\n';

exports['test KeyValue#decode'] = function () {
    assert.eql(simple_object, vdf.decode('a 1\n'));
    // FIXME: Failing right now
    //assert.eql(simple_object, kv.decode('a 1'));
    assert.eql(complex_object, vdf.decode(complex_object_encoded_f_f));
    assert.eql(complex_object, vdf.decode(complex_object_encoded_t_f));
};

exports['test KeyValue#encode'] = function () {
    assert.eql(complex_object_encoded_f_f, vdf.encode(complex_object));
    assert.eql(complex_object_encoded_t_t, vdf.encode(complex_object, true, true));
};
