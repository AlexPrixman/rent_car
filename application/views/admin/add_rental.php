<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Hacer una Renta</h1>
</div>

<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_rental' ?>" method="post">   
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Empleados</label>
                <div class="col-sm-2">
                    <select class="form-control" name="employee_name">
                    <?php if(isset($employee))?>
                        <?php foreach($employee as $k){?>
                            <option value="<?php echo $k->employee_name;?>"><?php echo $k->employee_name;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>  
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Vehiculos</label>
                <div class="col-sm-10">
                    <select class="form-control" id="selectValue">
                    <?php if(isset($car))?>
                        <?php foreach($car as $k){?>
                            <option value="<?php echo $k->car_id;?>"><?php echo $k->car_desc;?></option>
                        <?php  }  ?>  
                    </select>
                    <input type="hidden" name="car_id" id="hiddenInput" value="">
                    <input type="hidden" name="car_desc" id="hiddenInput2" value="">
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Clientes</label>
                <div class="col-sm-2">
                    <select class="form-control" name="customer_name">
                    <?php if(isset($customer))?>
                        <?php foreach($customer as $k){?>
                            <option value="<?php echo $k->customer_name;?>"><?php echo $k->customer_name;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de Renta</label>
                <div class="col-sm-2"><input type="date" min="2021-08-21" class="form-control date" name="rental_date" id="date1"></div>
                <?php echo form_error('rental_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de Retorno</label>
                <div class="col-sm-2"><input type="date" min="2021-08-22" class="form-control date" name="return_date" id="date2"></div>
                <?php echo form_error('return_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Monto por Dia</label>
                <div class="col-sm-2"><input type="number" min="0" class="form-control" oninput="validity.valid||(value='');" name="fee_per_day"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cantidad de Dias</label>
                <div class="col-sm-2"><input type="number"  readonly class="form-control" name="rental_time" id="amountOfDays"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Comentario</label>
                <div class="col-sm-8">
                    <textarea name="comment" id="" cols="30" rows="5"></textarea>
                </div>    
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Renta</label>
                <div class="col-sm-2">
                <select class="form-control" name="rental_status">
                    <option value="E">En Proceso</option>
                    <option value="T">Terminada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/rentals';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>
<script type="text/javascript">
var selectValue     = document.getElementById("selectValue");
var hiddenInput     = document.getElementById("hiddenInput");  

var date1           = document.getElementById("date1");
var date2           = document.getElementById("date2");
var date            = document.getElementsByClassName("date");
var amountOfDays    = document.getElementById("amountOfDays");
var days            = 1000 * 60 * 60 * 24;

date2.min = new Date().toISOString().split("T")[0];

selectValue.addEventListener('change', function(){
    hiddenInput.value = this.options[this.selectedIndex].value;
    hiddenInput2.value = this.options[this.selectedIndex].text
});

document.querySelectorAll('.date').forEach(item => {
  item.addEventListener('change', event => {
  
  	//Condicion para verificar si ambas fechas no son nulas
    if (date1.value && date2.value) {

			//Convirtiendo fechas en milisegundos
      var dateInitial = new Date(date1.value);
      var dateDelivery = new Date(date2.value);

			//Obteniendo diferencia entren ambas fechas en milisegundos
      var diferenciaDias = dateDelivery.getTime() - dateInitial.getTime();
			
      //Convirtiendo diferencia dias de milisegundos a dias
      var cantidadDias = diferenciaDias / days;

			//Colocando valor en input
      amountOfDays.value = cantidadDias;

    }
  
  })
});
</script>