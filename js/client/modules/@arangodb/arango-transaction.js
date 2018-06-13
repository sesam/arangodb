/* jshint strict: true */

// //////////////////////////////////////////////////////////////////////////////
// / @brief ArangoTransaction shell support for transactions
// /
// /
// / DISCLAIMER
// /
// / Copyright 2018 ArangoDB GmbH, Cologne, Germany
// /
// / Licensed under the Apache License, Version 2.0 (the "License")
// / you may not use this file except in compliance with the License.
// / You may obtain a copy of the License at
// /
// /     http://www.apache.org/licenses/LICENSE-2.0
// /
// / Unless required by applicable law or agreed to in writing, software
// / distributed under the License is distributed on an "AS IS" BASIS,
// / WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// / See the License for the specific language governing permissions and
// / limitations under the License.
// /
// / Copyright holder is triAGENS GmbH, Cologne, Germany
// /
// / @author Achim Brandt
// / @author Dr. Frank Celler
// / @author Copyright 2012-2013, triAGENS GmbH, Cologne, Germany
// //////////////////////////////////////////////////////////////////////////////

const internal = require('internal');
const arangosh = require('@arangodb/arangosh');
const ArangoError = require('@arangodb').ArangoError;


function ArangoTransaction (database, data) {
  this._id = 0;
  this._database = database;
  this._dbName = database._name();
  this._dbPrefix = '/_db/' + encodeURIComponent(database._name());

  if (!data || typeof (data) !== 'object') {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_HTTP_BAD_PARAMETER.code,
      errorNum: internal.errors.ERROR_BAD_PARAMETER.code,
      errorMessage: 'usage: ArangoTransaction(<object>)'
    });
  }

  data = Object.assign({}, data);

  if (!data.collections || typeof data.collections !== 'object') {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_HTTP_BAD_PARAMETER.code,
      errorNum: internal.errors.ERROR_BAD_PARAMETER.code,
      errorMessage: 'missing/invalid collections definition for transaction'
    });
  }

  data.collections = Object.assign({}, data.collections);
  if (data.collections.read) {
    if (!Array.isArray(data.collections.read)) {
      data.collections.read = [data.collections.read];
    }
    data.collections.read = data.collections.read.map(
      col => col.isArangoCollection ? col.name() : col
    );
  }
  if (data.collections.write) {
    if (!Array.isArray(data.collections.write)) {
      data.collections.write = [data.collections.write];
    }
    data.collections.write = data.collections.write.map(
      col => col.isArangoCollection ? col.name() : col
    );
  }

  if (data.action) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_HTTP_BAD_PARAMETER.code,
      errorNum: internal.errors.ERROR_BAD_PARAMETER.code,
      errorMessage: 'action definition is not supported'
    });
  }

  this._collections = data.collections;
}

exports.ArangoTransaction = ArangoTransaction;

function ArangoTransactionCollection(coll) {
  if (!coll || !coll.isArangoCollection) {
    throw "invaliid input";
  }
  this._collection = coll;
}

ArangoTransaction.prototype.begin = function() {

};

ArangoTransaction.prototype.collection = function(col) {
  if (col.isArangoCollection) {
    return new ArangoTransactionCollection(col);
  }
  return new ArangoTransactionCollection(this._database._collection(col));
};

ArangoTransaction.prototype.commit = function() {
  
};

ArangoTransaction.prototype.abort = function() {

};

ArangoTransactionCollection.prototype.save = 
ArangoTransactionCollection.prototype.insert = function(data, opts) {
  if (this._id === 0) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorNum: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorMessage: 'transaction not started yet'
    });
  }
  opts = opts || {};
  opts.transactionId = this._id;
  this._collection.insert(data, opts);
};

ArangoTransactionCollection.prototype.remove = function(id, opts) {
  if (this._id === 0) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorNum: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorMessage: 'transaction not started yet'
    });
  }
  opts = opts || {};
  opts.transactionId = this._id;
  this._database.collection(coll).remove(id, opts);
};

ArangoTransactionCollection.prototype.replace = function(data, opts) {
  if (this._id === 0) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorNum: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorMessage: 'transaction not started yet'
    });
  }
  opts = opts || {};
  opts.transactionId = this._id;
  this._database.collection(coll).replace(data, opts);
};

ArangoTransactionCollection.prototype.update = function(data, opts) {
  if (this._id === 0) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorNum: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorMessage: 'transaction not started yet'
    });
  }
  opts = opts || {};
  opts.transactionId = this._id;
  this._database.collection(coll).update(data, opts);
};

ArangoTransactionCollection.prototype.truncate = function(opts) {
  if (this._id === 0) {
    throw new ArangoError({
      error: true,
      code: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorNum: internal.errors.ERROR_TRANSACTION_INTERNAL.code,
      errorMessage: 'transaction not started yet'
    });
  }
  opts = opts || {};
  opts.transactionId = this._id;
  this._database.collection(coll).truncate(opts);
};