//service worker registration begins

function registerWorker(){

if (navigator.serviceWorker) {  // check if service worker is supported
    const dbPromise = idb.open('listOfCurrency', 1, upgradeDB => {
        upgradeDB.createObjectStore('currencies', { keyPath: 'currencyName' });
        upgradeDB.createObjectStore('exchange_rates', { keyPath: 'pair' });
    });
    
    navigator.serviceWorker.register('./sw.js')
        .then(registration => {  // once registered, check various states.
            if (registration.waiting) {
                return dbPromise.then(db => {
                    const tx = db.transaction('currencies');
                    const currencyStore = tx.objectStore('currencies');
                    return currencyStore.getAll();
                })
                .then(fullCurrencies => {
                    fillCurrency(fullCurrencies)
                    return fullCurrencies;
                });
            }
            else if (registration.installing) {
                const allCurrencyApiUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
                
                fetch(allCurrencyApiUrl)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    fillCurrency(Object.values(data.results));
                    dbPromise.then(dbObj => {
                        console.log('adding to db now')
                        const tx = dbObj.transaction('currencies', 'readwrite');
                        Object.values(data.results).map(currency => {
                            tx.objectStore('currencies').put(currency);
                        });
                    });
                });
                
                registration.installing.addEventListener('statechange', function () {
                    if (this.state === 'installed') {
                        return dbPromise.then(db => {
                            const tx = db.transaction('currencies');
                            const currencyStore = tx.objectStore('currencies');
                            return currencyStore.getAll();
                        }).then(fullCurrencies => {
                            fillCurrency(fullCurrencies)
                            return fullCurrencies;
                        });
                    }
                });
            }
            else if (registration.active.state === 'activated') {
                return dbPromise.then(db => {
                    const tx = db.transaction('currencies');
                    const currencyStore = tx.objectStore('currencies');
                    return currencyStore.getAll();
                })
                .then(fullCurrencies => {
                    fillCurrency(fullCurrencies)
                    return fullCurrencies;
                });
            }
           
        })
        .catch(e => {
            console.error(e);
        })
} else {
    console.log('Service Worker is not supported in this browser.');
}
 }

function fillCurrency(currency){

        return currency.map(curr => {
        let node = document.createElement('option');
        node.value = curr.id;
        node.textContent = `[${curr.id}] - ${curr.currencyName} `;
        document.getElementById('currency_from').appendChild(node);
        document.getElementById('currency_to').appendChild(node.cloneNode(true));
    });
 }


function convertCurrency(){
    const dbPromise = idb.open('listOfCurrency', 1, upgradeDB => {
        upgradeDB.createObjectStore('currencies', { keyPath: 'currencyName' });
        upgradeDB.createObjectStore('exchange_rates', { keyPath: 'pair' });
    });
    const currencyFrom =  document.getElementById('currency_from').value ;
    const currencyTo = document.getElementById('currency_to').value ;
    const amount = document.getElementById('amount').value ;

    let moneyPair = `${currencyFrom}_${currencyTo}`;
    console.log('converting', currencyFrom, 'to', currencyTo);

    const exchangeApiURL = `https://free.currencyconverterapi.com/api/v5/convert?q=${moneyPair}&compact=y`;

    return dbPromise.then(db => {
        const tx = db.transaction('exchange_rates');
        const ratesStore = tx.objectStore('exchange_rates');
        return ratesStore.get(moneyPair);
    })
    .then(rates => { // check if the rate of the current currency pair exists in the IndexedDB
        if(rates) {
            let convertedAmount = ((rates.exchange_rate) * amount);
            document.getElementById('value').value = convertedAmount;
        } else { // if the pair doesnt exist, make an api call and save the currency pair in the DB
            fetch(exchangeApiURL)
            .then(response => {
                return response.json();
            })
            .then(data => {
                console.log(data)
                return dbPromise.then(dbObj => {
                    const rate = {
                        pair: Object.keys(data)[0],
                        exchange_rate: Object.values(data)[0].val
                    };
                    const tx = dbObj.transaction('exchange_rates', 'readwrite');
                    tx.objectStore('exchange_rates').put(rate);
                    
                    let convertedAmount = ((rate.exchange_rate) * amount);
                    document.getElementById('value').value = convertedAmount;
                    console.log(convertedAmount)
                    return rate;
                });
            });
        }
    });

}
