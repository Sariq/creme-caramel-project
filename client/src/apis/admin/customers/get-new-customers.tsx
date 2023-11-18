import axios from "axios";

export const getNewCustomersApi = (page: number = 1) => {
    return axios
      .post(`${process.env.REACT_APP_API}customer/new-customers/${page}`)
      .then(function (response) {
        //   console.log("get orders list success", response);
          return response.data;
      });
  };

  export default getNewCustomersApi;