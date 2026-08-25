const dns = require("dns");

dns.resolveSrv(
    "_mongodb._tcp.cluster0.028q274.mongodb.net",
    (err, records) => {

        if(err){
            console.log("DNS ERROR:", err);
        }
        else{
            console.log("DNS OK:", records);
        }

    }
);