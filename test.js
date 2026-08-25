fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        phone: "09123456789",
        otp: "کدی که سرور چاپ کرده"
    })
})
.then(res => res.json())
.then(data => {
    console.log(data);
})
.catch(err => {
    console.log(err);
});