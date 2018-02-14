exports.createHandler = function (method) {
    return new Handler(method);
};

Handler = function(method) {
    this.process = function(req, res, urlOptions) {
        params = null;
        return method.apply(this, [req, res, urlOptions, params]);
    }
};