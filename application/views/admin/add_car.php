<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Agregar un Vehiculo</h1>
</div>

<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_car_act' ?>" method="post">     
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion del Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_desc"></div>
                <?php echo form_error('car_desc'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Chasis del Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_chasis"></div>
                <?php echo form_error('car_chasis'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Motor</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_engine"></div>
                <?php echo form_error('car_engine'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Vehiculo</label><a class="btn btn-info btn-edit" name="cat_id" href="<?php echo base_url().'home/category/';?>">
                                        <i class="fas fa-cog"></i> Admin
                                    </a>
                <div class="col-sm-2">
                    <select class="form-control" name="cat_desc">
                    <?php if(isset($categories))?>
                        <?php foreach($categories as $k){?>
                            <option value="<?php echo $k->cat_desc;?>"><?php echo $k->cat_desc;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Marca del Vehiculo</label><a class="btn btn-info btn-edit" name="brand_id" href="<?php echo base_url().'home/brand/';?>">
                                <i class="fas fa-cog"></i> Admin
                            </a>
                <div class="col-sm-2">
                    <select class="form-control" name="brand_desc">
                    <?php if(isset($brand))?>
                        <?php foreach($brand as $k){?>
                            <option value="<?php echo $k->brand_desc;?>"><?php echo $k->brand_desc;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Modelo del Vehiculo</label><a class="btn btn-info btn-edit" name="model_id" href="<?php echo base_url('home/model/');?>">
                                <i class="fas fa-cog"></i> Admin
                            </a>
                <div class="col-sm-2">
                    <select class="form-control" name="model_desc">
                    <?php if(isset($model))?>
                        <?php foreach($model as $k){?>
                            <option value="<?php echo $k->model_desc;?>"><?php echo $k->model_desc;?></option>
                        <?php  }  ?>  
                    </select>
                </div> 
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Placa</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_plate"></div>
                <?php echo form_error('car_plate'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Combustible</label>
                <div class="col-sm-2">
                    <select class="form-control" name="fuel_desc">
                        <option value="G">Gasolina</option>
                        <option value="D">Diesel</option>
                    </select>
                </div>    
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado del Vehiculo</label>
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
                    <a href="<?php echo base_url().'home/car';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>