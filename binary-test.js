// ======================================================
// BINARY DETECTION TEST
// ======================================================

function isBinaryMessage(text){

    if(!text)
        return false;

    const value =
        text
        .replace(/\s+/g, "")
        .trim();

    // فقط 0 و 1 باشد
    if(!/^[01]+$/.test(value))
        return false;

    // حداقل 8 بیت
    if(value.length < 8)
        return false;

    // طول باید مضرب 8 باشد
    if(value.length % 8 !== 0)
        return false;

    return true;
}


// ======================================================
// TEST DATA
// ======================================================

const tests = [

    "01001000",

    "01001000 01100101 01101100 01101111",

    "11011000 10111110 11011000 10101110",

    "101",

    "1010101",

    "روبو سلام",

    "روبو 01010101",

    "12345678",

    "hello",

    "01001000 سلام",

    "11111111"

];


// ======================================================
// RUN TEST
// ======================================================

console.log("");
console.log("======================================");
console.log("       BINARY DETECTION TEST");
console.log("======================================");
console.log("");

tests.forEach((text,index)=>{

    const result =
        isBinaryMessage(text);

    console.log(
        `${index + 1}. ${JSON.stringify(text)}`
    );

    if(result){

        console.log(
            "   🚫 BINARY -> BLOCK"
        );

    }else{

        console.log(
            "   ✅ NORMAL -> ALLOW"
        );

    }

    console.log(
        "--------------------------------------"
    );

});

console.log("");
console.log("Test finished.");
console.log("");