/**
 * **************************************
 * ************* linnet.js **************
 * **************************************
 *
 * A light weight AJAX library.
 */
(function(root) {

    // Defining Constants
    var CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';
    var CONTENT_TYPE_JSON = 'application/json';
    var CONTENT_TYPE_HTML = 'text/html';
    var HTTP_METHOD_GET = 'GET';
    var HTTP_METHOD_POST = 'POST';
    var HTTP_METHOD_PUT = 'PUT';
    var HTTP_METHOD_DELETE = 'DELETE';
    var HTTP_HEADER_CONTENT_TYPE = 'Content-Type';

    var DATA_TYPE_FUNCTION = 'function';

    // Have a reference of global JavaScript methods for faster access
    // This will avoid function lookup in global object every time function are sought for
    var euri = root.encodeURIComponent;
    var reduce = Array.prototype.reduce;

    // Defaults
    var TIMEOUT = 60000;
    var ERROR = {
        ETIMEOUT: 101
    };

    /****************************************
     ****************************************
     ********** Connection Class ************
     ****************************************
     ****************************************/

    /**
     * class Connection
     * Connect is used encapsulate everything is required for a new XMLHttpRequst `AJAX`
     *
     *
     * Class properties:
     *
     * PRIVATE
     * `xhr`        New XMLHttpRequest Object
     *
     * PUBLIC
     * `method`     http method GET|POST|PUT|DELETE
     * `header`     http request headers
     * `payload`    data to be passed along with XMLHttpRequest
     * `url`        Url to which request to be made
     *
     * Class Behaviours
     *
     * PROTECTED/PUBLIC
     * `getXHR`     returns xhr object [Private Property]
     * `execute`    onreadystatechange event handler
     * `setHeaders` sets http request headers
     *
     * @param {Object} options  connection options
     * @constructor
     */

    function Connection(options) {
        // Private Properties
        var xhr = new XMLHttpRequest();

        // Public Properties
        this.method = options.method || HTTP_METHOD_GET;
        this.headers = options.headers || {};
        this.payload = serialize(options.data || {});
        this.url = options.url;

        // Protected Properties
        this.getXHR = function() {
            return xhr;
        }

        // If connection is for GET, add payload into the request url
        if (this.method === HTTP_METHOD_GET && this.payload) {
            this.url = getURL(url, payload);
            this.payload = null;
        }
    }

    /**
     * onreadystagechnage handler
     * This is called with every time `readystate` is changed
     * It does nothing until `readystate` value is 4
     * If readystate === 4, it process the xhr response and callbacks provided by the end user
     *
     * @param  {tid}    tid         setTimeout id
     * @param  {Object} deferred    Custom promise object
     *
     */
    Connection.prototype.execute = function(tid, deferred) {
        var xhr = this.getXHR();

        if (tid) {
            clearTimeout(tid);
        }
        if (xhr.readyState === 4) {
            var err = (!xhr.status ||
                (xhr.status < 200 || xhr.status >= 300) &&
                xhr.status !== 304);

            return deferred.exec(err, xhr.responseText, xhr);

        }
    };

    // TO-DO FIXME for other HTTP methods
    /**
     * set `XMLHttpRequest` request headers
     */
    Connection.prototype.setHeaders = function() {
        var xhr = this.getXHR(); // get current connection xhr
        var contentType = CONTENT_TYPE_JSON; // default Content-Type 
        var headers = this.headers; // headers provided by end users

        for (var key in headers) {
            if (headers.hasOwnProperty(h)) {
                if (key.toLowerCase() === HTTP_HEADER_CONTENT_TYPE.toLowerCase())
                    contentType = headers[key];
                else
                    xhr.setRequestHeader(key, headers[key]);
            }
        }

        xhr.setRequestHeader(HTTP_HEADER_CONTENT_TYPE, contentType || getContentHeader(this.method));
    }

    /****************************************
     *****************************************
     ********** Deferred Class ***************
     *****************************************
     ****************************************/

    /**
     * class Deferred
     * A custom promise class to create jQuery like ajax utility
     */
    function Deferred() {
        // Handler methods
        this.handlers = [];
    }

    // Re-defining then in the context of Deferred
    Deferred.prototype.error = Deferred.prototype.done = then;


    /**
     * executes registered callbacks
     */
    Deferred.prototype.exec = function() {
        this.result = arguments;
        this.finished = true;
        for (var i = 0; i < this.handlers.length; i++) {
            this.handlers[i].apply(null, arguments);
        }
        this.handlers = [];
    };

    /*****************************************
     *****************************************
     ********** Common Functions *************
     *****************************************
     ****************************************/

    /**
     * serialize payload
     * @param  {Object} payload data to be serialized into query string
     * @return {String} params  serialize object
     */
    function serialize(payload) {
        var params = [];
        // If payload is a string return it as is
        if (typeof payload === 'string') {
            return payload;
        }

        // If payload is an object, convert it into query params
        for (var prop in payload) {
            if (payload.hasOwnProperty(prop)) {
                params.push(getQueryParam(prop, payload[prop]));
            }
        }
        return params.join('&');
    }

    /**
     * joins strings key & value by '=' i.e. key=value
     * Mostly used to create query params e.g. http://www.example.com/test?key=value
     *
     * @param  {String} key query param key
     * @param  {String} val query param value
     * @return {String} {key=value} output string
     */
    function getQueryParam(key, val) {
        return euri(key) + '=' + euri(val);
    }

    /**
     * constructs HTTP url using given url and params.
     * Mostly it will be used to construct a url for HTTP GET
     *
     * @param  {String} url    http request url
     * @param  {String} params query params
     * @return {String} url    final url
     */
    function getURL(url, params) {
        var joinWith = '?'; // By Default, use `?` to append params in give url

        // If url already have params, use `&` to append given params 
        if (url.indexOf('?') === -1) {
            joinWith = '&'
        }

        return url + joinWith + params;
    }

    /**
     * get content header if not set explicitly
     * @param  {String} method          http method
     * @return {String} contentType     content type header
     */
    function getContentHeader(method) {
        var contentType;

        switch (method) {
            case 'GET':
                contentType = CONTENT_TYPE_JSON;
                break;
            case 'POST':
                contentType = CONTENT_TYPE_FORM_URLENCODED;
                break;
            default:
                contentType = CONTENT_TYPE_JSON;
        }
        return contentType;
    }

    /**
     * XMLHttpRequest timeout handler
     *
     * @param  {Object} deferred
     *
     */
    function onTimeout(deferred) {
        this.abort();
        deferred.done(ERROR_ETIMEOUT, "", this);
    }

    /**
     * Performs Native Promise then alike functionality
     *
     * @param  {Function} fn      callback
     * @param  {Object}   context Content in which fn to be executed
     *
     */
    function then(fn, context) {
        var output;
        var _this = this;
        if (_this.finished) {
            output = fn.apply(context, this.result);
        } else {
            output = new Deferred();

            _this.handlers.push(function() {
                var response = fn.apply(context, arguments);
                if (response && typeof response.then === DATA_TYPE_FUNCTION)
                    response.then(output.finished, output);
            });
        }
        return output;
    };

    /*******************************************
     ***************** Public APIs *************
     *******************************************/

    /**
     * public api for XMLHttpRequset
     *
     * options:
     * `method`     http method GET|POST|PUT|DELETE
     * `headers`     http request headers
     * `payload`    data to be passed along with XMLHttpRequest
     * `url`        Url to which request to be made
     *
     * @param  {Object} options
     * @return {Object} Deferred    Custom Promise
     */
    function request(options) {

        var deferred = new Deferred();
        var connection = new Connection(options);
        var xhr = connection.getXHR();
        var tid;

        xhr.open(connection.method, connection.url);
        connection.setHeaders();

        // Set explicit timeout for request
        tid = setTimeout(onTimeout.bind(xhr, deferred), TIMEOUT);

        // Attach readystate change handler
        // provide tid and deffered 
        xhr.onreadystatechange = connection.execute.bind(connection, tid, deferred);
        xhr.send(connection.payload);

        return deferred;
    }

    // TO-DO expose other public APIs
    /**
     * get: request.bind(null, 'GET'),
     * post: request.bind(null, 'POST'),
     * put: request.bind(null, 'PUT'),
     * del: request.bind(null, 'DELETE'),
     * @type {[type]}
     */

    var Linnet = {
        request: request
    };

    root.Linnet = Linnet;

})(this);