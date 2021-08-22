<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Hacer una Inspeccion</h1>
</div>

<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_inspection' ?>" method="post">   
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
                    <select class="form-control" name="customer_desc">
                    <?php if(isset($customer))?>
                        <?php foreach($customer as $k){?>
                            <option value="<?php echo $k->customer_name;?>"><?php echo $k->customer_name;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene Ralladuras?</label>
                <div class="col-sm-2">
                <select class="form-control" name="is_damaged">
                    <option value="Y">Si</option>
                    <option value="N">No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nivel de Combustible</label>
                <div class="col-sm-10 pt-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="fuel_level" value="1">
                        <label class="form-check-label">1/4</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="fuel_level" value="2">
                        <label class="form-check-label">1/2</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="fuel_level" value="3">
                        <label class="form-check-label">3/4</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="fuel_level" value="4">
                        <label class="form-check-label">Lleno</label>
                    </div>
                </div>
                <?php echo form_error('fuel_level'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene Goma de Repuesto?</label>
                <div class="col-sm-2">
                <select class="form-control" name="spare_tire">
                    <option value="Y">Si</option>
                    <option value="N">No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene Gato Hidraulico?</label>
                <div class="col-sm-2">
                <select class="form-control" name="hydraulic_jack">
                    <option value="Y">Si</option>
                    <option value="N">No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene roturas en el Cristal?</label>
                <div class="col-sm-2">
                <select class="form-control" name="windows_scratch">
                    <option value="Y">Si</option>
                    <option value="N">No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma Frontal Izquierda?</label>
                <div class="col-sm-2">
                <select class="form-control" name="left_front_tire">
                    <option value="B">Bien</option>
                    <option value="D">Deteriorada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma Frontal Derecha?</label>
                <div class="col-sm-2">
                <select class="form-control" name="right_front_tire">
                    <option value="B">Bien</option>
                    <option value="D">Deteriorada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma Trasera Izquierda?</label>
                <div class="col-sm-2">
                <select class="form-control" name="left_rear_tire">
                    <option value="B">Bien</option>
                    <option value="D">Deteriorada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma Trasera Derecha?</label>
                <div class="col-sm-2">
                <select class="form-control" name="right_rear_tire">
                    <option value="B">Bien</option>
                    <option value="D">Deteriorada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Etc.</label>
                <div class="col-sm-8">
                    <textarea name="Etc" id="" cols="30" rows="5"></textarea>
                </div>    
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de la Inspeccion</label>
                <div class="col-sm-2"><input type="date" class="form-control date" name="inspection_date" id="date2"></div>
                <?php echo form_error('inspection_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Empleado</label>
                <div class="col-sm-2">
                    <select class="form-control" name="employee_desc">
                    <?php if(isset($employee))?>
                        <?php foreach($employee as $k){?>
                            <option value="<?php echo $k->employee_name;?>"><?php echo $k->employee_name;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>  
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Renta</label>
                <div class="col-sm-2">
                <select class="form-control" name="inspection_status">
                    <option value="A">Aprobada</option>
                    <option value="R">Rechazada</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/inspection';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>
<script type="text/javascript"> 
var date2           = document.getElementById("date2");

date2.max = new Date().toISOString().split("T")[0];
</script>