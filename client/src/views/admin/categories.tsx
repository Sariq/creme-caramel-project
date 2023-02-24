import getCategoriesListApi from "apis/admin/category/get-categories";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TCategory } from "shared/types/category";

export default function CategoriesList() {
  const [categorytList, setCategorytList] = useState<TCategory[]>([]);
  useEffect(() => {
    getCategoriesListApi().then((res)=>{
     console.log(res)
     setCategorytList(res);
   })
  }, []);

  if(!categorytList){
    return null;
  }
  return (
       <div className="flex flex-wrap justify-center relative">
     <div className="w-full px-4">
      <h1 className="text-4xl m-auto w-fit">קטגוריות</h1>
      <div className="flex gap-5 flex-wrap mt-10 -mx-1 lg:-mx-4">
        {categorytList.map((category) => (
          <Link
            className="my-1 px-1 transition duration-500 hover:scale-105"
            to={`${category?._id}`}
          >
            <div>
              <article className="overflow-hidden rounded-lg shadow-lg">
                <img
                  alt="Placeholder"
                  className="block  w-80 h-40"
                  src={category.img}
                />
                <div className="flex items-center leading-tight p-2 md:p-4">
                  <div className="text-lg w-full text-center">
                    <span className="text-black	">{category.name}</span>
                  </div>
                </div>
              </article>
            </div>
            
          </Link>
        ))}
      </div>
    </div>
    </div>

  );
}
