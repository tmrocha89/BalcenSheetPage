const CalcTotal = function(category){
  //  console.log("CalcTotal", category)
    if (!category) return category.value || 0;
    if (!category.data)
        return category.value || 0;

    const subTotal = category.data.reduce((accumulator, currentValue) => accumulator + CalcTotal(currentValue), 0)
//console.log("sub", subTotal, category)
    return subTotal + (category.value || 0);
}

const GetValue = function(category){
      //console.log("GetValue", category)
      if (!category) return [category.value || 0];
      if (!category.data)
          return [category.value || 0];
  
      const subTotal = category.data.map((currentValue) => GetValue(currentValue), 0)
  //console.log("GetValue - sub", subTotal)
      return subTotal.flat(Infinity);
  }

const FlatSubCategories = function(category){
    if (!category) return category;

    if (!category.data) return category.name;

    const subTotal = category.data.map((sub) => category.name + " - "+ FlatSubCategories(sub) )
    return subTotal;
}

const BalanceSheet = function (data) {
    this._data = data;
    //var currentDate = new Date();
    //this._currentMonth = currentDate.getUTCMonth() + 1;
    //this._currentYear = currentDate.getUTCFullYear();
};

BalanceSheet.prototype.SetCurrentMonthData = function(month, year){
    this._currentMonth = month;
    this._currentYear = year;
    return this.GetMonthData(month, year);
}

BalanceSheet.prototype.GetCurrentMonthData = function(){
    return this.GetMonthData(this._currentMonth, this._currentYear);
}

BalanceSheet.prototype.SetOldMonthData = function(month, year){
    this._oldMonth = month;
    this._oldYear = year;
    return this.GetMonthData(month, year) || {
        name: "Unknown",
        labels: [],
        values: []
    };
}

BalanceSheet.prototype.GetMonthData = function(month, year){
    var data = this._data.years
        .find(y => y.id == year && y.enable !== false)
        .months
        .find(m => m.id == month && m.enable !== false);
    console.log("GetMonthData", data, month, year)
    var monthData = {
        name: "Unknown",
        labels : [],
        values: []
    };
    
    if (!data) return monthData;
    data.data.forEach((d) => {
       // console.log(d,"....")
        monthData.labels.push(d.name);
        monthData.values.push(d.data ? d.data.reduce((acc, curr) => acc + CalcTotal(curr), 0) : CalcTotal(d));
    });
    monthData.name = data.name;
//    console.log(monthData)
    return monthData;
}

BalanceSheet.prototype.FilterCurrentDataBy = function(names){
    return this.FilterBy(this._currentMonth, this._currentYear, names);
}

BalanceSheet.prototype.FilterBy = function(month, year, names){
    var data = this._data.years
        .find(y => y.id == year && y.enable !== false)
        .months
        .find(m => m.id == month);
    //console.log("FilterBy - data", data)
    
    var monthData = {
        name: "Unknown",
        labels : [],
        values: []
    };
    
    if(!data) return monthData;

    data.data.forEach((d) => {
        if(d.name == names){
            //console.log(d,"....","FILTER!!!")
            monthData.labels = d.data ? d.data.reduce((acc, current) => acc.concat(FlatSubCategories(current)), []) : [FlatSubCategories(d)];
            monthData.values = d.data ? d.data.reduce((acc, current) => acc.concat(GetValue(current)), [] ) : GetValue(d);
        }
    });
    monthData.name = data.name;
    //console.log("FilterBy - returning", monthData)
    return monthData;
}

BalanceSheet.prototype.GetDates = function(){
    const data = [];
    for (var year of this._data.years){
        if (year.enable !== false)
            data.push({
                name: year.name,
                id: year.id,
                months: year.months.filter(m => m.enable !== false).map(m => {return {name:m.name, id:m.id}})
            })
    }
    console.log("GetDates returning", data)
    return data;
}

BalanceSheet.prototype.GetTotal = function(month, year){
    return this.GetMonthData(month, year)
    .values
    .reduce((accumulator, current) => accumulator + current, 0);
}