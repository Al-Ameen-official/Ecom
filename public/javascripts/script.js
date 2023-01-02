


let addToCart=(productId)=>{
   $.ajax({
    url:'/addToCart?id='+productId,
    method :'get',
    success:(response)=>{
        if(response.status){
            alert('product added to cart')
            
        }
    }
   })

}
let changeQuantity=(productid,userid,cartid,count)=>{
    let qty = parseInt(document.getElementById(productid).innerHTML)
      
    $.ajax({
        url:'/changeProductCount',
        data:{
            user:userid,
            product:productid,
            count:count,
            qty:qty,
            cart:cartid
        },
        method:'post',
        success:(response)=>{
           
            if(response.removeProduct)
            {
                alert("Product removed")
                
                document.getElementById(productid+"element").remove()
                document.getElementById('total').innerHTML="CART IS EMPTY"
            }
            else{
               
               
                document.getElementById('total').innerHTML=response.total
                document.getElementById(productid).innerHTML = parseInt(qty)+parseInt(count);
            }   
        }
    })
}
let deleteCartProduct=(cart,product,user)=>{
    if(confirm('Are You sure want to remove this product from the cart'))
    {
        $.ajax({
            url:'/deleteCartProducts',
            data:{
                cartId:cart,
                productId:product,
                
            },
            method:'post',
            success:(response)=>{
                if(response.removed)
                {
                    
                    document.getElementById(product+"element").remove()
                    alert("Product removed")
                }
            }
    
        })
    }else{
        alert('product not removed')
    }
    

}
let deleteProduct=(id)=>{
    if(confirm("Are you sure you want to delete")){
        $.ajax({
            url:'/admin/deleteProducts',
            data:{
                productId:id
            },
            method:'post',
            success:(response)=>{
                if(response.removed){
                    document.getElementById().remove()
                    alert("Product removed")
                }else{
                    alert("product not removed")
                }
            }
        })
    }
}
let editUser=()=>{
    userName=document.getElementById('username').value;
    userID=document.getElementById('userId').value;
    Phone=document.getElementById('phone').value;
    Email=document.getElementById('email').value;
    password=document.getElementById('firstpass').value;
    $.ajax({
        url:'/edit-user',
        data:{
            userId:userID,
            phone:Phone,
            email:Email,
            username:userName,
            firstpass:password
        },
        method:'post',
        success:(response)=>{
            if(response.status)
            {
                alert('changes saved')
                top.location.href="/";

            }else{
                alert("Password entered is wrong,Please retry")
            }
        }
        
    })
}    

