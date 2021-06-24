<?php
class Login extends CI_Controller{
    
    function __construct()
    {
        parent::__construct();
        if($this->session->userdata('admin'))
            redirect('admin/dashboard');
    }

    function index(){
        $this->load->view('admin');
    }

    function verify(){
        $this->load->model('admin');
        $check = $this->admin->validate();

        if($check){
            // echo "Credentials are correct.";
            $this->session->set_userdata('admin','1');
            redirect('admin/dashboard');

        } else {

            redirect('admin');
 
        }
    }

}