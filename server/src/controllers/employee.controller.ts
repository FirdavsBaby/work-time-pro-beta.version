import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { listEmployeesQuerySchema, createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import { ok, created } from '../utils/response';

export async function list(req: Request, res: Response): Promise<void> {
  const query = listEmployeesQuerySchema.parse(req.query);
  const result = await employeeService.listEmployees(query);
  ok(res, result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const employee = await employeeService.getEmployeeById(req.params.id);
  ok(res, employee);
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createEmployeeSchema.parse(req.body);
  const employee = await employeeService.createEmployee(input);
  created(res, employee);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateEmployeeSchema.parse(req.body);
  const employee = await employeeService.updateEmployee(req.params.id, input);
  ok(res, employee);
}

export async function archive(req: Request, res: Response): Promise<void> {
  const employee = await employeeService.archiveEmployee(req.params.id);
  ok(res, employee);
}
