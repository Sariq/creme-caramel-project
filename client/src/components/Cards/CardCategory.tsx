import React from "react";


const CategoryCard = () => {
    const categoryList: any[] = require("../../mocks/CategoryMock.json");
    return(
        <div>
            {categoryList.map((category)=> <div>{category.name}</div>)}
        </div>
    )
}

export default CategoryCard;