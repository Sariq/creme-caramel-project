import React from "react";

export type TCategory = {
    name: string;
    img: string;
    count: number;
};

const CategoryCard = () => {
    const categoryList: any[] = require("../../mocks/CategoryMock.json");
    return(
        <div>
            {categoryList.map((category)=> <div>{category.name}</div>)}
        </div>
    )
}

export default CategoryCard;