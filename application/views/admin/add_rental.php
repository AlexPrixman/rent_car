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
                    <select class="form-control" name="car_desc">
                    <?php if(isset($car))?>
                        <?php foreach($car as $k){?>
                            <option value="<?php echo $k->car_desc;?>"><?php echo $k->car_desc;?></option>
                        <?php  }  ?>  
                    </select>
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
                <div class="col-sm-2"><input type="date" min="2021-08-14" class="form-control" name="rental_date"></div>
                <?php echo form_error('rental_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de Retorno</label>
                <div class="col-sm-2"><input type="date" min="2021-08-15" class="form-control" name="return_date"></div>
                <?php echo form_error('return_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Monto por Dia</label>
                <div class="col-sm-2"><input type="number" min="0" class="form-control" oninput="validity.valid||(value='');" name="fee_per_day"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cantidad de Dias</label>
                <div class="col-sm-2"><input type="number" min="1" class="form-control" name="rental_time"></div>
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
                <select class="form-control" name="car_status">
                    <option value="D">Disponible</option>
                    <option value="R">Rentado</option>
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