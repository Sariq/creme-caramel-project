import axios from "axios";

export const getCategoriesListApi = (page: number = 1) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/categories/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getCategoriesListApi;