const discord = require("discord.js");
const client = new discord.Client();
const request = require("request").defaults({
    timeout: 15000
});

var config = {
    prefix: "!",
    token: "NTU3OTk3MjgyNjA4NTQ1Nzky.D3QbEQ.lNvaxena1uCLFNbmRXvoZKUwLPY"
}
var api = {};
api.stockX = {};

client.on("ready", () => {
    console.log("Bot ready!");
    client.user.setActivity("Getting the latest OW restock!", "PLAYING");
});

client.on("message", message => {
    if(message.author.bot) return;

    if(message.content.indexOf(config.prefix) !== 0) return;

    var args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    var command = args.shift().toLowerCase();

    if (command == "stockx") {
        if (args[0].includes("stockx.com")) {
            api.stockX.url("https://stockx.com/api/products/" + args[0].split("/")[3] + "?includes=market,360", (data) => {
                if (data.s) {
                    //success
                    api.Notification(data.data, message);
                } else { //failure
                    message.channel.send("Sorry, I couldn't get the requested resource!"); } });
                

        } else {
            api.stockX.keywords(args, (data) => {
                if (data.s) {
                    //success
                    api.Notification(data.data, message);
                } else {
                    //failure
                    message.channel.send("Sorry, I couldn't get the requested resource!");
                } }); } } else 
          { return; } });
    


client.login(config.token);

api.Notification = (data, message) => {
    message.channel.send({
        embed: {
            color: 0x43ab49,
            author: {
                name: "StockX Bot",
                icon_url: "https://pbs.twimg.com/profile_images/880500140984946689/YLtBaLZS_400x400.jpg"
            },
            title: data.product.name,
            url: data.product.url,
            thumbnail: {
                url: data.product.image
            },
            fields: data.discord,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "A-Team Bot V3.0 Made By Younes"
            }
        }
    });
}


api.stockX.url = (url, cb) => {
    request({
        url: url,
        method: "GET"
    }, (err, response) => {
        if (!err && response.statusCode == 200) {
            let tempBody = JSON.parse(response.body).Product;

            let productObj = {};
            productObj.market = {};
            productObj.market.sizes = [];

            productObj.name = tempBody.title;
            productObj.sku = tempBody.styleId;
            productObj.url = "https://stockx.com/" + tempBody.urlKey;
            productObj.date = tempBody.releaseDate;
            productObj.price = "$" + tempBody.retailPrice;
            productObj.image = tempBody.media.imageUrl;
            productObj.brand = tempBody.brand;

            productObj.market.lowestAsk = "$" + tempBody.market.lowestAsk;
            productObj.market.highestBid = "$" + tempBody.market.highestBid;
            productObj.market.totalSold = tempBody.market.deadstockSold;
            productObj.market.averagePrice = "$" + tempBody.market.averageDeadstockPrice;
            

        //usd to eur
            var x = tempBody.market.lowestAsk;
            var y = tempBody.market.highestBid;
            var z = tempBody.market.averageDeadstockPrice;
           var cc = 0.89;
            var lowest = x*cc;
            var high = y*cc;
            var avarage = z*cc;
     

            let discordFields = [{
                name: "Retail Price",
                value: `${productObj.price}`,
                inline: true
            },
            {
                name: "Product SKU",
                value: `${productObj.sku}`,
                inline: true
            },
            {
                name: "Release Date",
                value: `${productObj.date}`,
                inline: true
            },
            {
                name: "Brand",
                value: `${productObj.brand}`,
                inline: true
            },
            {
                name: "Lowest Ask",
                value: `${productObj.market.lowestAsk} - €${lowest}`,
                inline: true
            },
            {
                name: "Highest Bid",
                value: `${productObj.market.highestBid} - €${high}`,
                inline: true
            },
            {
                name: "Total Sold",
                value: `${productObj.market.totalSold}`,
                inline: true
            },
            {
                name: "Average Price",
                value: `${productObj.market.averagePrice} - €${avarage}`,
                inline: true
            }];

       

            for (let size in tempBody.children) {
                productObj.market.sizes.push({
                    size: tempBody.children[size].shoeSize,
                    highestBid: "$" + tempBody.children[size].market.highestBid
                });
                
 var eu = tempBody.children[size].market.highestBid;
                var ava = eu*0.89
                discordFields.push({
                    name: "US " + tempBody.children[size].shoeSize,
                    value: `$${eu} - €${ava}`,
                    inline: true
                });
            }

            cb({
                s: true,
                data: {
                    product: productObj,
                    discord: discordFields
                }
            });
            
        } else {
            cb({
                s: false,
                data: "request to stockx.com failed."
            });
        }
    });
}

api.stockX.keywords = (keywords, callback) => {
    request({
        url: "https://xw7sbct9v6-dsn.algolia.net/1/indexes/products/query?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.29.0&x-algolia-application-id=XW7SBCT9V6&x-algolia-api-key=6bfb5abee4dcd8cea8f0ca1ca085c2b3",
        method: "POST",
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `{"params":"query=${keywords}&hitsPerPage=20&facets=*"}`
    }, (err, response) => {
        if (!err && response.statusCode == 200) {
            try {
                let x = JSON.parse(response.body);

                api.stockX.url("https://stockx.com/api/products/" + x.hits[0].url + "?includes=market,360", (data) => {
                    if (data.s) {
                        //success
                        callback({
                            s: true,
                            data: data.data
                        });
                    } else {
                        //failure
                        callback({
                            s: false,
                            data: "No products found"
                        });
                    }
                });
            } catch (err) {
                callback({
                    s: false,
                    data: "No products found"
                });
            }
        } else {
            callback({
                s: false,
                data: "Request failed"
            });
        }
    });
}
client.on('message', (receivedMessage) => {

    if (receivedMessage.author == client.user) { // Prevent bot from responding to its own messages

        return

    }

    

    if (receivedMessage.content.startsWith("!restock")) {

       

console.log('Ateam');

    receivedMessage.channel.send(`@everyone RESTOCK HERE`)}

  

})
client.on('message', (receivedMessage) => {

    if (receivedMessage.author == client.user) { // Prevent bot from responding to its own messages

        return

    }

    

    if (receivedMessage.content.startsWith("!pleaserestock")) {

       

console.log('Ateam');

    receivedMessage.channel.send(`Preparazione restock Off-White in corso... `)}

  

})










